"""Model loading and inference.

Design points worth explaining in an interview:
  * Loaded ONCE per process (lru_cache) - not on every request, not at import time.
  * Integrity-checked against MANIFEST.json (pickle = code execution risk).
  * A "contract check" fails fast if feature order or class labels ever drift.
  * Pure function of its input: no Django request objects in here, so it is trivial
    to unit test and could be moved to a separate microservice later.
"""
from __future__ import annotations

import hashlib
import json
import logging
from collections.abc import Mapping
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from django.conf import settings

from .schema import MISSING_VALUE, MODEL_FEATURE_ORDER

logger = logging.getLogger(__name__)


class ModelUnavailable(RuntimeError):
    """The model could not be loaded or failed its integrity/contract checks."""


@dataclass(frozen=True)
class ModelPrediction:
    code: int                   # 1 = autism, 2 = control (DX_GROUP coding of the dataset)
    probability_autism: float
    probability_control: float


def classify(probability_autism: float, band: tuple[float, float]) -> str:
    """Turn a probability into an outcome label, with an explicit 'inconclusive' zone."""
    lower, upper = band
    if probability_autism >= upper:
        return "likely_asd"
    if probability_autism <= lower:
        return "unlikely_asd"
    return "inconclusive"


class Predictor:
    def __init__(self, artifact_dir: Path):
        self._dir = Path(artifact_dir)
        manifest = self._read_manifest()
        self._verify_hashes(manifest)
        try:
            self._scaler = joblib.load(self._dir / "scaler.pkl")
            self._model = joblib.load(self._dir / "voting_classifier_model.pkl")
        except Exception as exc:  # corrupt file, wrong sklearn version, ...
            raise ModelUnavailable(f"Could not load model artifacts: {exc}") from exc
        self._check_contract()
        digest = manifest["sha256"]["voting_classifier_model.pkl"][:8]
        self.version = f"{manifest['model_name']}@{digest}"
        logger.info("Loaded model %s", self.version)

    # -- startup checks --------------------------------------------------
    def _read_manifest(self) -> dict:
        try:
            return json.loads((self._dir / "MANIFEST.json").read_text())
        except (OSError, ValueError) as exc:
            raise ModelUnavailable(f"MANIFEST.json missing or unreadable: {exc}") from exc

    def _verify_hashes(self, manifest: dict) -> None:
        for name, expected in manifest["sha256"].items():
            actual = hashlib.sha256((self._dir / name).read_bytes()).hexdigest()
            if actual != expected:
                raise ModelUnavailable(f"Integrity check failed for {name}.")

    def _check_contract(self) -> None:
        if list(self._scaler.feature_names_in_) != MODEL_FEATURE_ORDER:
            raise ModelUnavailable("Scaler feature order does not match MODEL_FEATURE_ORDER.")
        if [int(c) for c in self._model.classes_] != [1, 2]:
            raise ModelUnavailable("Unexpected class labels; expected [1, 2].")

    # -- inference -------------------------------------------------------
    def predict(self, features: Mapping[str, float | int | None]) -> ModelPrediction:
        """`features` uses model column names (e.g. 'ADOS_TOTAL'). Absent/None -> -9999."""
        row = [
            MISSING_VALUE if features.get(name) is None else features[name]
            for name in MODEL_FEATURE_ORDER
        ]
        # A DataFrame keeps column names, matching how the scaler was fitted.
        frame = pd.DataFrame([row], columns=MODEL_FEATURE_ORDER, dtype=float)
        scaled = self._scaler.transform(frame)
        probabilities = self._model.predict_proba(scaled)[0]
        by_class = dict(zip((int(c) for c in self._model.classes_), probabilities, strict=True))
        p_autism, p_control = float(by_class[1]), float(by_class[2])
        return ModelPrediction(
            code=1 if p_autism >= p_control else 2,
            probability_autism=p_autism,
            probability_control=p_control,
        )


@lru_cache(maxsize=1)
def get_predictor() -> Predictor:
    return Predictor(settings.ML_ARTIFACT_DIR)
