import { useState } from 'react';
import Modal from 'react-modal';

interface ModalProps {
  children : any,
  modalIsOpen: boolean
  closeModal: () => void
  afterOpenModal?: () => {}
  customStyles?: any
}
// Modal.setAppElement('body');
const ModalPopup = (props: ModalProps) => {
  // const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const {children, modalIsOpen, afterOpenModal, closeModal} = props
  console.log(props, 'props')
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };
  return (
    <Modal
      isOpen={modalIsOpen}
      onAfterOpen={afterOpenModal}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Example Modal"
      ariaHideApp={false}
    >
      {children}
    </Modal>
  )
}

export default ModalPopup;