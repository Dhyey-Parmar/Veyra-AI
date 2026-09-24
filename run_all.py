import os
import sys
import subprocess
import time

def main():
    print("=" * 70)
    print("VEYRA - INTELLIGENT CREDIT RISK ANALYTICS")
    print("FastAPI Backend + React + Vite Frontend Launcher")
    print("=" * 70)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    models_path = os.path.join(root_dir, "models", "best_pipeline.pkl")

    if not os.path.exists(models_path):
        print("\n[!] Trained model not detected at models/best_pipeline.pkl")
        print("    Running train_pipeline.py to train models and generate artifacts...")
        subprocess.run([sys.executable, "train_pipeline.py"], cwd=root_dir, check=True)
    else:
        print("\n[✓] Trained production ML pipeline verified.")

    # Check frontend node_modules
    frontend_dir = os.path.join(root_dir, "frontend")
    node_modules = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules):
        print("\n[!] Installing React dependencies (npm install)...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, shell=True, check=True)
    else:
        print("[✓] React frontend dependencies verified.")

    print("\n[+] Starting FastAPI backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=root_dir
    )

    time.sleep(2)

    print("[+] Starting Veyra React frontend on http://localhost:3000 ...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    print("\n" + "=" * 70)
    print("VEYRA PLATFORM RUNNING:")
    print("  • Frontend UI: http://localhost:3000")
    print("  • Backend API: http://127.0.0.1:8000/api/health")
    print("Press Ctrl+C to stop both services.")
    print("=" * 70 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Services stopped.")

if __name__ == '__main__':
    main()
