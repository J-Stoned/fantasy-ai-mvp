#!/bin/bash
# CUDA Installation Script for WSL2
# This script installs CUDA toolkit for GPU ML training

echo "🚀 FANTASY.AI CUDA INSTALLATION SCRIPT"
echo "====================================="
echo ""
echo "This script will install:"
echo "- CUDA Toolkit 11.8"
echo "- cuDNN 8.x"
echo "- TensorFlow GPU dependencies"
echo ""
echo "Please run this script with: bash install-cuda-wsl.sh"
echo ""

# Check if running in WSL
if ! grep -q microsoft /proc/version; then
    echo "❌ This script is designed for WSL2. Exiting."
    exit 1
fi

# Check if CUDA keyring exists
if [ ! -f "cuda-keyring_1.1-1_all.deb" ]; then
    echo "📥 Downloading CUDA repository keyring..."
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb
fi

echo ""
echo "📋 INSTALLATION STEPS:"
echo "1. Install CUDA repository"
echo "2. Update package lists"
echo "3. Install CUDA toolkit"
echo "4. Set up environment variables"
echo ""
echo "⚠️  IMPORTANT: This script needs sudo access."
echo "   You'll be prompted for your password."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Install CUDA repository
echo "🔧 Installing CUDA repository..."
sudo dpkg -i cuda-keyring_1.1-1_all.deb

# Update package lists
echo "📦 Updating package lists..."
sudo apt-get update

# Install CUDA toolkit (specific version for TensorFlow compatibility)
echo "🚀 Installing CUDA 11.8 toolkit (this may take 5-10 minutes)..."
sudo apt-get install -y cuda-toolkit-11-8

# Install additional libraries
echo "📚 Installing additional CUDA libraries..."
sudo apt-get install -y \
    libcudnn8=8.9.7.29-1+cuda11.8 \
    libcudnn8-dev=8.9.7.29-1+cuda11.8 \
    libnccl2 \
    libnccl-dev

# Set up environment variables
echo "🔧 Setting up environment variables..."
echo '' >> ~/.bashrc
echo '# CUDA Configuration' >> ~/.bashrc
echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
echo 'export CUDA_HOME=/usr/local/cuda-11.8' >> ~/.bashrc

# Source the bashrc
source ~/.bashrc

# Verify installation
echo ""
echo "✅ Verifying CUDA installation..."
if command -v nvcc &> /dev/null; then
    nvcc --version
    echo "✅ CUDA compiler installed successfully!"
else
    echo "⚠️  CUDA compiler not found in PATH"
fi

# Check NVIDIA driver in WSL
echo ""
echo "🔍 Checking NVIDIA GPU access in WSL..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi
else
    echo "⚠️  nvidia-smi not found. Make sure you have:"
    echo "   1. NVIDIA GPU drivers installed on Windows"
    echo "   2. WSL2 GPU support enabled"
fi

echo ""
echo "🎉 CUDA INSTALLATION COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Close and reopen your terminal (or run: source ~/.bashrc)"
echo "2. Run the ML training script: npm run ml:train-real"
echo ""
echo "Your GPU is ready for maximum power ML training! 🚀"