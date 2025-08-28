import toast from 'react-hot-toast'

export const notify = {
  success(message: string) {
    toast.success(message, { duration: 2500 })
  },
  error(message: string) {
    toast.error(message, { duration: 3500 })
  },
  info(message: string) {
    toast(message, { duration: 3000, icon: 'ℹ️' })
  },
  warning(message: string) {
    toast(message, { duration: 3000, icon: '⚠️' })
  }
}

export default notify


