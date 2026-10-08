"""Focused guard checks; never load a model or contact a serving endpoint."""
import importlib.util
import json
from pathlib import Path
import tempfile
import time
import subprocess
import sys
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('pilot_worker',Path(__file__).with_name('worker.py'))
w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)


class Guards(unittest.TestCase):
    def test_disabled_before_any_network_or_process(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(w,'STATE',Path(directory)), patch.object(w,'http') as http, patch.object(w.subprocess,'Popen') as popen:
            with self.assertRaisesRegex(RuntimeError,'disabled'):
                w.run({})
            http.assert_not_called();popen.assert_not_called()

    def test_expired_or_wrong_artifact_cannot_activate(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(w,'STATE',Path(directory)):
            path=Path(directory)/'activation.json'
            value={'enabled':True,'approvedBy':'Robert','expiresAt':'2026-10-08T00:00:00+00:00','artifactSha256':w.CONFIG['sha256']}
            path.write_text(json.dumps(value));path.chmod(0o600)
            with self.assertRaises(RuntimeError):w.activation(now=time.time())
            value['expiresAt']='2099-01-01T00:00:00+00:00';path.write_text(json.dumps(value))
            with self.assertRaises(RuntimeError):w.activation(now=time.time())

    def test_example_activation_stays_disabled(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(w,'STATE',Path(directory)):
            path=Path(directory)/'activation.json'
            path.write_text(Path(__file__).with_name('activation.example.json').read_text());path.chmod(0o600)
            with self.assertRaisesRegex(RuntimeError,'disabled'):w.activation()

    def test_fixed_loopback_single_gpu_command(self):
        cmd=w.command()
        for flag,value in [('--host','127.0.0.1'),('--alias','gemma4-31b'),('--n-gpu-layers','24'),('--ctx-size','16384'),('--parallel','1')]:
            self.assertEqual(cmd[cmd.index(flag)+1],value)
        self.assertIn('--no-context-shift',cmd)
        self.assertFalse(w.CONFIG['productionFallback'])

    def test_resource_growth_yields_to_household(self):
        sample={'gpu':[{'device':0,'XPUM_STATS_MEMORY_USED':28000},{'device':1,'XPUM_STATS_MEMORY_USED':18000}]}
        with patch.object(Path,'read_text',return_value='MemAvailable: 70000000 kB\n'):
            w.resource_guard(sample,[19000,18000])
            with self.assertRaises(RuntimeError):w.resource_guard(sample,[17000,18000])
            with self.assertRaises(RuntimeError):w.resource_guard(sample,[19000,17000])
            with self.assertRaises(RuntimeError):w.resource_guard(sample,None)

    def test_parent_death_guard_survives_exec(self):
        code='import ctypes;v=ctypes.c_int();ctypes.CDLL(None).prctl(2,ctypes.byref(v),0,0,0);print(v.value)'
        result=subprocess.check_output([sys.executable,'-c',code],preexec_fn=w.parent_death_guard,text=True)
        self.assertEqual(result.strip(),'9')


if __name__=='__main__':unittest.main()
