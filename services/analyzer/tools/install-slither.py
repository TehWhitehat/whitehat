"""Install Slither into the local venv using the host Python's pip.

This Windows sandbox cannot write into Python's private mode-0700 temp dirs;
use ordinary inherited permissions for package-download scratch directories.
"""
import pathlib
import runpy
import sys
import tempfile
import uuid

root = pathlib.Path(__file__).resolve().parents[1]
scratch = root / "work" / "pip-temp"
scratch.mkdir(parents=True, exist_ok=True)

def scratch_directory(suffix=None, prefix=None, dir=None):
    path = scratch / ((prefix or "tmp") + uuid.uuid4().hex + (suffix or ""))
    path.mkdir(mode=0o755)
    return str(path)

tempfile.mkdtemp = scratch_directory
sys.argv = ["pip", "install", "--only-binary=:all:", "--disable-pip-version-check", "--target", str(root / ".venv" / "Lib" / "site-packages"), "-r", str(root / "requirements.txt"), "--cache-dir", str(scratch / "cache")]
runpy.run_module("pip", run_name="__main__")
