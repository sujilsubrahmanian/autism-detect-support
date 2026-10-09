"""Regenerate ml_artifacts/MANIFEST.json after retraining the model.

    python scripts/make_manifest.py

The manifest pins the SHA-256 of each pickle. At startup the predictor refuses
to load a file whose hash differs. Pickle files can execute arbitrary code when
loaded, so integrity checking matters even for "our own" artifacts.
"""
import hashlib
import json
from pathlib import Path

import joblib
import sklearn

ARTIFACTS = Path(__file__).resolve().parent.parent / "ml_artifacts"
FILES = ["scaler.pkl", "voting_classifier_model.pkl"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    scaler = joblib.load(ARTIFACTS / "scaler.pkl")
    model = joblib.load(ARTIFACTS / "voting_classifier_model.pkl")
    manifest = {
        "model_name": "voting-rf-gb",
        "description": "Soft-voting ensemble of RandomForest + GradientBoosting on ABIDE phenotypic scores",
        "sklearn_version": sklearn.__version__,
        "feature_order": list(scaler.feature_names_in_),
        "classes": [int(c) for c in model.classes_],
        "class_meaning": {"1": "autism (DX_GROUP=1)", "2": "control (DX_GROUP=2)"},
        "sha256": {name: sha256(ARTIFACTS / name) for name in FILES},
    }
    (ARTIFACTS / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
