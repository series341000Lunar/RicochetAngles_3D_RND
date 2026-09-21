"""Isolated validation workspace; does not overwrite user workspace."""
import importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('server',ROOT/'server/authoring_server.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
s.WORKSPACE=ROOT/'test-output/integration.authoring.json'
if not s.WORKSPACE.exists():s.atomic_write((ROOT/'fixtures/seed.authoring.json').read_bytes())
s.ThreadingHTTPServer(('127.0.0.1',18766),s.Handler).serve_forever()
