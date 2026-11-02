import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile
spec = importlib.util.spec_from_file_location('release', Path(__file__).resolve().parents[1] / 'tools/release.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class ReleaseTest(unittest.TestCase):
    def test_publish_and_conflict(self):
        with tempfile.TemporaryDirectory() as directory:
            base=Path(directory); source=base/'source'; runtime=base/'runtime'; source.mkdir()
            (source/'file.js').write_text('one')
            m.release(source,runtime,True)
            self.assertEqual(m.inventory(source),m.inventory(runtime))
            with zipfile.ZipFile(base/'MrSohnWordCheck.zip') as archive:
                self.assertEqual(archive.namelist(),['MrSohnWordCheck/file.js'])
            (source/'file.js').write_text('two')
            m.release(source,runtime)
            self.assertEqual((runtime/'file.js').read_text(),'one')
            (runtime/'file.js').write_text('independent')
            with self.assertRaisesRegex(RuntimeError,'independent changes'):m.release(source,runtime,True)
            self.assertEqual((runtime/'file.js').read_text(),'independent')
    def test_removal(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'source';source.mkdir();runtime=Path(directory)/'runtime'
            (source/'old').write_text('old');m.release(source,runtime,True)
            (source/'old').unlink();m.release(source,runtime,True)
            self.assertFalse((runtime/'old').exists())
if __name__=='__main__':unittest.main()
