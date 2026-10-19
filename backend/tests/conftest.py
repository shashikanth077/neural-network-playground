import os
import tempfile

# Keep the test suite away from the developer's real experiment database.
os.environ.setdefault("DB_PATH", os.path.join(tempfile.mkdtemp(prefix="ailab-tests-"), "tests.db"))
