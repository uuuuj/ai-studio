import subprocess
import os
import signal
import time
import re
import sys
from pathlib import Path
from typing import Optional, List


class StreamlitService:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.app_file = Path("app.py")
        self.port = 8501

    def extract_imports(self, code: str) -> List[str]:
        """Extract import statements from code to identify required packages"""
        imports = set()

        # Find all import statements
        import_pattern = r'^import\s+(\w+)|^from\s+(\w+)'
        for line in code.split('\n'):
            line = line.strip()
            if match := re.match(import_pattern, line):
                package = match.group(1) or match.group(2)
                # Skip standard library and streamlit (already installed)
                if package not in ['streamlit', 'st', 'os', 'sys', 'time', 'datetime',
                                  'json', 're', 'math', 'random', 'collections']:
                    imports.add(package)

        return list(imports)

    def install_package(self, package: str) -> bool:
        """Install a Python package using pip"""
        try:
            print(f"Installing package: {package}")
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'install', package],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                print(f"Successfully installed {package}")
                return True
            else:
                print(f"Failed to install {package}: {result.stderr}")
                return False
        except Exception as e:
            print(f"Error installing {package}: {str(e)}")
            return False

    def install_required_packages(self, code: str) -> dict:
        """Auto-install packages required by the code"""
        packages = self.extract_imports(code)
        if not packages:
            return {"installed": [], "failed": []}

        installed = []
        failed = []

        for package in packages:
            if self.install_package(package):
                installed.append(package)
            else:
                failed.append(package)

        return {"installed": installed, "failed": failed}

    def save_code(self, code: str) -> Path:
        """Save Streamlit code to a file"""
        with open(self.app_file, 'w', encoding='utf-8') as f:
            f.write(code)
        return self.app_file

    def run(self, code: str) -> dict:
        """Run Streamlit app with auto package installation"""
        # Stop existing process if running
        self.stop()

        # Auto-install required packages
        print("Checking for required packages...")
        package_result = self.install_required_packages(code)

        if package_result["installed"]:
            print(f"Auto-installed packages: {', '.join(package_result['installed'])}")

        if package_result["failed"]:
            print(f"Warning: Failed to install packages: {', '.join(package_result['failed'])}")

        # Save code to file
        self.save_code(code)

        # Start Streamlit process
        try:
            self.process = subprocess.Popen(
                ['streamlit', 'run', str(self.app_file), '--server.port', str(self.port)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )

            # Wait a bit for Streamlit to start
            time.sleep(3)

            # Check if process is still running
            if self.process.poll() is not None:
                stderr = self.process.stderr.read().decode()
                raise Exception(f"Streamlit failed to start: {stderr}")

            response = {
                "status": "running",
                "url": f"http://localhost:{self.port}",
                "pid": self.process.pid
            }

            # Include package installation info
            if package_result["installed"] or package_result["failed"]:
                response["packages"] = package_result

            return response

        except FileNotFoundError:
            raise Exception("Streamlit is not installed. Please run: pip install streamlit")
        except Exception as e:
            raise Exception(f"Failed to start Streamlit: {str(e)}")

    def stop(self) -> dict:
        """Stop Streamlit app"""
        if self.process and self.process.poll() is None:
            try:
                if os.name == 'nt':  # Windows
                    self.process.send_signal(signal.CTRL_BREAK_EVENT)
                    time.sleep(1)
                    if self.process.poll() is None:
                        self.process.terminate()
                        time.sleep(1)
                        if self.process.poll() is None:
                            self.process.kill()
                else:  # Unix
                    self.process.terminate()
                    time.sleep(1)
                    if self.process.poll() is None:
                        self.process.kill()

                self.process = None
                return {"status": "stopped"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        return {"status": "not_running"}

    def status(self) -> dict:
        """Get Streamlit app status"""
        if self.process and self.process.poll() is None:
            return {
                "running": True,
                "url": f"http://localhost:{self.port}",
                "pid": self.process.pid
            }
        return {"running": False}


streamlit_service = StreamlitService()
