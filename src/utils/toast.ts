import toast from 'react-hot-toast';

// Custom toast utility with standardized styling
export const customToast = {
  success: (message: string, options?: { duration?: number }) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      style: {
        background: '#10B981',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '400',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        maxWidth: '500px',
        width: 'fit-content',
        minWidth: '300px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    });
  },

  error: (message: string, options?: { duration?: number }) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      style: {
        background: '#EF4444',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '400',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        maxWidth: '500px',
        width: 'fit-content',
        minWidth: '300px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    });
  },

  loading: (message: string, options?: { duration?: number }) => {
    return toast.loading(message, {
      style: {
        background: '#6366F1',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '400',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        maxWidth: '500px',
        width: 'fit-content',
        minWidth: '300px',
      },
    });
  },

  info: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      style: {
        background: '#6366F1',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '400',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        maxWidth: '500px',
        width: 'fit-content',
        minWidth: '300px',
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
        fontWeight: '400',
        padding: '12px 20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: 'fit-content',
        minWidth: '300px',
      },
      success: {
        style: {
          background: '#10B981',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      },
      error: {
        style: {
          background: '#EF4444',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      },
      loading: {
        style: {
          background: '#6366F1',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        },
      },
    });
  },
};

export default customToast;
