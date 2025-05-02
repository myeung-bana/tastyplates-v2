import { ReactNode, useState } from 'react';

interface ModalProps {
  children : ReactNode,
  modalIsOpen: boolean
  closeModal: () => void
  afterOpenModal?: () => {}
  customStyles?: any
}


const ModalPopup = ({children, ...props}: ModalProps) => {
  const {modalIsOpen, afterOpenModal, closeModal} = props
  console.log(props, 'props')

  return (
    <></>
  )
}

export default ModalPopup;