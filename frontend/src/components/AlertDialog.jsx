// src/components/AlertDialog.jsx
import Modal from './Modal';

const AlertDialog = ({ isOpen, title = 'Notice', message, onClose, confirmText = 'OK' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        {message && (
          <p className="text-gray-700 mb-4">{message}</p>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;


