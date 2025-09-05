// src/components/Modal.jsx
// Legacy Modal component - use the new UI Modal instead
import { Modal as UIModal } from './ui';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
    >
      {children}
    </UIModal>
  );
};

export default Modal;