import toast from 'react-hot-toast';

// Custom toast utility with standardized white pill-shape styling
export const customToast = {
  success: (message: string, options?: { duration?: number }) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      style: {
        background: '#ffffff',
        color: '#10B981',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        maxWidth: '400px',
        width: 'fit-content',
        minWidth: '200px',
      },
      iconTheme: {
        primary: '#10B981',
        secondary: '#ffffff',
      },
    });
  },

  error: (message: string, options?: { duration?: number }) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      style: {
        background: '#ffffff',
        color: '#EF4444',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        maxWidth: '400px',
        width: 'fit-content',
        minWidth: '200px',
      },
      iconTheme: {
        primary: '#EF4444',
        secondary: '#ffffff',
      },
    });
  },

  loading: (message: string, options?: { duration?: number }) => {
    return toast.loading(message, {
      style: {
        background: '#ffffff',
        color: '#6366F1',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        maxWidth: '400px',
        width: 'fit-content',
        minWidth: '200px',
      },
    });
  },

  info: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      style: {
        background: '#ffffff',
        color: '#6366F1',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        maxWidth: '400px',
        width: 'fit-content',
        minWidth: '200px',
      },
    });
  },

  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        maxWidth: '400px',
        width: 'fit-content',
        minWidth: '200px',
      },
      success: {
        style: {
          background: '#ffffff',
          color: '#10B981',
        },
        iconTheme: {
          primary: '#10B981',
          secondary: '#ffffff',
        },
      },
      error: {
        style: {
          background: '#ffffff',
          color: '#EF4444',
        },
        iconTheme: {
          primary: '#EF4444',
          secondary: '#ffffff',
        },
      },
      loading: {
        style: {
          background: '#ffffff',
          color: '#6366F1',
        },
      },
    });
  },
};

export default customToast;
