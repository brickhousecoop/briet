# Running

I use [`pdm`](https://pdm-project.org/en/latest/) which you can get with `brew install pdm`, but you should be able to work with any python dependency manager that can parse `pyproject.toml`

1. `pdm install`
2. `$(pdm venv activate)`
3. `python format_for_import.py`
