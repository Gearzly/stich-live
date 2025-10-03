// Simple toast utility
export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    // For now, just log to console. In a real app, you'd use a toast library like react-hot-toast
  },
  error: (message: string) => {
    console.error('❌ Error:', message);
    // For now, just log to console. In a real app, you'd use a toast library like react-hot-toast
  },
  info: (message: string) => {
    console.log('ℹ️ Info:', message);
  }
};