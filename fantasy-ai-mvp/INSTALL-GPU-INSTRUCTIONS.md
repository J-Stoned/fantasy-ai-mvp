# 🚀 GPU Acceleration Installation Guide

## Quick Start

To enable GPU acceleration for your ML training, follow these steps:

### Step 1: Install CUDA (Required)

Open your terminal and run:

```bash
cd /mnt/c/Users/st0ne/fantasy.AI-MVP/fantasy-ai-mvp
bash scripts/install-cuda-wsl.sh
```

**Important:**
- You'll be prompted for your sudo password
- Installation takes 5-10 minutes
- The script will install CUDA 11.8 and cuDNN 8.x

### Step 2: Restart Terminal

After installation completes:
1. Close your terminal completely
2. Open a new terminal
3. Navigate back to your project:
   ```bash
   cd /mnt/c/Users/st0ne/fantasy.AI-MVP/fantasy-ai-mvp
   ```

### Step 3: Verify GPU Setup

Run the verification script:

```bash
npx tsx scripts/verify-gpu-setup.ts
```

You should see:
- ✅ CUDA installed
- ✅ cuDNN installed
- ✅ GPU detected: NVIDIA RTX 4060
- ✅ TensorFlow GPU ready

### Step 4: Run GPU-Accelerated Training

Once verified, run the GPU training:

```bash
npx tsx scripts/train-gpu-accelerated.ts
```

## What to Expect

### During CUDA Installation:
- Downloads CUDA repository keyring
- Updates package lists
- Installs CUDA toolkit 11.8
- Installs cuDNN libraries
- Configures environment variables

### During GPU Training:
- 5-10x faster than CPU training
- Real-time GPU monitoring (utilization, memory, temperature)
- Larger batch sizes (128-256 vs 32)
- More complex models with more parameters
- Training 6 models with 50,000+ samples each

## Troubleshooting

### If CUDA installation fails:
1. Make sure you're in WSL2: `grep microsoft /proc/version`
2. Update your system: `sudo apt update && sudo apt upgrade`
3. Check Windows GPU drivers are updated

### If GPU not detected after installation:
1. Restart WSL: In PowerShell run `wsl --shutdown`, then reopen
2. Check NVIDIA drivers on Windows are updated
3. Ensure WSL2 GPU support is enabled

### If TensorFlow doesn't use GPU:
1. Check CUDA version: `nvcc --version` (should show 11.8)
2. Check cuDNN: `dpkg -l | grep cudnn`
3. Verify LD_LIBRARY_PATH: `echo $LD_LIBRARY_PATH`

## GPU Training Benefits

With your RTX 4060 (8GB), you'll get:
- **Player Performance Model**: 50 epochs in ~30 seconds (vs 3-5 minutes CPU)
- **Injury Risk LSTM**: Complex sequence modeling with 128 LSTM units
- **Lineup Optimizer**: 512-unit dense layers with batch normalization
- **Trade Analyzer**: Ensemble models training in parallel
- **Draft Assistant**: GRU-based sequence prediction
- **Game Outcome**: Deep neural network with 6 layers

## Next Steps

After GPU training completes:
1. Models are saved in `./models-gpu/` directory
2. Review the `GPU-TRAINING-REPORT.json` for performance metrics
3. Test the ML API endpoints with GPU-trained models
4. Deploy to production for ultra-fast predictions

---

**Ready to accelerate? Start with Step 1 above! 🚀**