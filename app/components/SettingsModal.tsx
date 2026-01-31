import React from 'react'

interface SettingsModalProps {
    email? : string | null;
    pageName : string | null;
    onPageNameChange : (newPageName: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SettingsModal: React.FC<SettingsModalProps> = ({email, pageName, onPageNameChange}) => {
  return (
    <dialog id="my_modal_3" className="modal">
        <div className="modal-box">
            <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Paramètres</h3>
            <label className='form-control w-full'>
                <div className='label'>
                    <span className='label-text'>Le nom de votre page n&apos;est pas modifiable</span>
                    {pageName? (
                        <div>
                            <div className='badge badge-primary'>{pageName}</div>
                        </div>
                    ) : (
                        <div className='space-x-2'>
                            <input 
                                type="text" 
                                placeholder='Nom de votre page'
                                className='input input-bordered input-sm w-fill'
                                //value={ne}
                            />
                            <button
                                className='btn btn-sm w-fit btn-primary'
                            >
                                Enregistrer
                            </button>
                        </div>
                    )}
                </div>
            </label>
        </div>
    </dialog>
  )
}

export default SettingsModal
