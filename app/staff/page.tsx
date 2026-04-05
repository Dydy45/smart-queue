/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { addStaff, getStaffByCompany, updateStaffRole, removeStaff, getPostsByCompanyEmail, assignPostToStaff, unassignPostFromStaff, getAssignedPosts } from '../actions'
import { Staff, Post } from '../generated/prisma'
import { Trash, UserPlus, X } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useToast } from '@/lib/useToast'
import { usePageTour } from '@/lib/usePageTour'
import SkeletonTable from '../components/SkeletonTable'

const page = () => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const { showError, showSuccess } = useToast()

  const [staffList, setStaffList] = useState<Staff[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [assignedPostsMap, setAssignedPostsMap] = useState<Record<string, Post[]>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
  const [staffEmail, setStaffEmail] = useState('')
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState<'ADMIN' | 'STAFF'>('STAFF')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  usePageTour('staff', [
    {
      element: '#tour-staff-form',
      popover: {
        title: 'Ajoutez votre premier employé',
        description: 'Renseignez l\'<strong>email</strong> et le <strong>nom</strong> de l\'employé, choisissez son rôle :<br><ul style="margin-top:8px;padding-left:16px;"><li><strong>Admin</strong> — gère services, postes et plannings</li><li><strong>Staff</strong> — traite uniquement les tickets des postes assignés</li></ul><br>Une fois ajouté, cliquez sur <em>Postes</em> en face de l\'employé pour lui assigner ses postes.',
        side: 'right',
        align: 'start',
      },
    },
  ], !!email)

  const fetchStaff = async (isFirst = false) => {
    if (isFirst) setLoading(true)
    try {
      if (email) {
        const data = await getStaffByCompany(email)
        if (data) {
          setStaffList(data)
          // Charger les postes assignés pour chaque staff
          for (const staff of data) {
            await fetchAssignedPosts(staff.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      showError('Erreur lors du chargement des employés')
    } finally {
      if (isFirst) {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  const fetchPosts = async () => {
    try {
      if (email) {
        const data = await getPostsByCompanyEmail(email)
        if (data) {
          setPosts(data)
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const fetchAssignedPosts = async (staffId: string) => {
    try {
      if (email) {
        const data = await getAssignedPosts(email, staffId)
        if (data) {
          setAssignedPostsMap(prev => ({ ...prev, [staffId]: data }))
        }
      }
    } catch (error) {
      console.error('Error fetching assigned posts:', error)
    }
  }

  useEffect(() => {
    if (email) {
      fetchStaff(true)
      fetchPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const handleAddStaff = async () => {
    if (!email || !staffEmail || !staffName) {
      showError('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    try {
      await addStaff(email, staffEmail, staffName, staffRole)
      showSuccess('Employé ajouté avec succès')
      setStaffEmail('')
      setStaffName('')
      setStaffRole('STAFF')
      await fetchStaff()
    } catch (error) {
      console.error('Error adding staff:', error)
      showError(error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'employé')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (staffId: string, newRole: 'ADMIN' | 'STAFF') => {
    if (!email) return

    try {
      await updateStaffRole(email, staffId, newRole)
      showSuccess('Rôle mis à jour avec succès')
      fetchStaff()
    } catch (error) {
      console.error('Error updating role:', error)
      showError('Erreur lors de la mise à jour du rôle')
    }
  }

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    const confirmation = window.confirm(`Êtes-vous sûr de vouloir supprimer ${staffName} ?`)
    if (!confirmation || !email) return

    try {
      await removeStaff(email, staffId)
      showSuccess('Employé supprimé avec succès')
      fetchStaff()
    } catch (error) {
      console.error('Error removing staff:', error)
      showError('Erreur lors de la suppression de l\'employé')
    }
  }

  const handleAssignPost = async (staffId: string, postId: string) => {
    if (!email) return

    try {
      await assignPostToStaff(email, staffId, postId)
      showSuccess('Poste assigné avec succès')
      await fetchAssignedPosts(staffId)
    } catch (error) {
      console.error('Error assigning post:', error)
      showError('Erreur lors de l\'assignation du poste')
    }
  }

  const handleUnassignPost = async (staffId: string, postId: string) => {
    if (!email) return

    try {
      await unassignPostFromStaff(email, staffId, postId)
      showSuccess('Poste désassigné avec succès')
      await fetchAssignedPosts(staffId)
    } catch (error) {
      console.error('Error unassigning post:', error)
      showError('Erreur lors de la désassignation du poste')
    }
  }

  return (
    <Wrapper>
      <div className='flex w-full flex-col md:flex-row'>
        {/* Formulaire d'ajout */}
        <div id="tour-staff-form" className='space-y-2 md:w-1/3 w-full'>
          <h2 className='text-xl font-bold mb-4'>Ajouter un employé</h2>

          <div>
            <span className='label-text'>Email de l&apos;employé</span>
            <input
              type='email'
              placeholder='email@exemple.com'
              className='input input-bordered input-sm w-full'
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              disabled={loading}
              aria-label='Email de l&apos;employé'
            />
          </div>

          <div>
            <span className='label-text'>Nom de l&apos;employé</span>
            <input
              type='text'
              placeholder='Nom complet'
              className='input input-bordered input-sm w-full'
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              disabled={loading}
              aria-label='Nom de l&apos;employé'
            />
          </div>

          <div>
            <span className='label-text'>Rôle</span>
            <select
              className='select select-bordered select-sm w-full'
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as 'ADMIN' | 'STAFF')}
              disabled={loading}
              aria-label='Rôle de l&apos;employé'
            >
              <option value='STAFF'>Staff</option>
              <option value='ADMIN'>Admin</option>
            </select>
          </div>

          <button
            className='btn btn-primary btn-sm mt-4 w-full'
            onClick={handleAddStaff}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className='loading loading-spinner loading-sm' role='status' aria-label='Chargement'></span>
                Ajout...
              </>
            ) : (
              <>
                <UserPlus className='w-4 h-4' />
                Ajouter l&apos;employé
              </>
            )}
          </button>
        </div>

        {/* Liste des employés */}
        <div className='mt-4 md:mt-0 md:ml-4 md:w-2/3 md:border-l border-base-200 md:pl-4 w-full'>
          <h3 className='font-semibold mb-4'>Liste des employés</h3>

          {isInitialLoad ? (
            <div className='overflow-x-auto'>
              <table className='table w-full'>
                <tbody>
                  <SkeletonTable rows={4} cols={[6, 20, 32, 16, 14]} />
                </tbody>
              </table>
            </div>
          ) : staffList.length === 0 ? (
            <EmptyState IconComponent='Users' message='Aucun employé pour le moment' />
          ) : (
            <div className='overflow-x-auto'>
              <table className='table w-full'>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff, index) => (
                    <React.Fragment key={staff.id}>
                      <tr>
                        <th>{index + 1}</th>
                        <td>{staff.name}</td>
                        <td className='text-sm text-base-content/70'>{staff.email}</td>
                        <td>
                          <select
                            className='select select-bordered select-xs'
                            value={staff.role}
                            onChange={(e) => handleUpdateRole(staff.id, e.target.value as 'ADMIN' | 'STAFF')}
                            aria-label={`Modifier le rôle de ${staff.name}`}
                          >
                            <option value='STAFF'>Staff</option>
                            <option value='ADMIN'>Admin</option>
                          </select>
                        </td>
                        <td>
                          <div className='flex gap-2'>
                            <button
                              className='btn btn-xs btn-primary'
                              onClick={() => setSelectedStaffId(selectedStaffId === staff.id ? null : staff.id)}
                              aria-label={`Gérer les postes de ${staff.name}`}
                            >
                              Postes
                            </button>
                            <button
                              className='btn btn-xs btn-error'
                              onClick={() => handleRemoveStaff(staff.id, staff.name)}
                              aria-label={`Supprimer ${staff.name}`}
                            >
                              <Trash className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {selectedStaffId === staff.id && (
                        <tr>
                          <td colSpan={5} className='bg-base-200/50'>
                            <div className='p-4'>
                              <h4 className='font-semibold mb-2'>Postes assignés à {staff.name}</h4>
                              
                              {/* Liste des postes assignés */}
                              <div className='mb-4'>
                                {assignedPostsMap[staff.id]?.length > 0 ? (
                                  <div className='flex flex-wrap gap-2'>
                                    {assignedPostsMap[staff.id].map((post) => (
                                      <div key={post.id} className='badge badge-primary gap-2'>
                                        {post.name}
                                        <button
                                          onClick={() => handleUnassignPost(staff.id, post.id)}
                                          className='btn btn-ghost btn-xs'
                                          aria-label={`Retirer ${post.name}`}
                                        >
                                          <X className='w-3 h-3' />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className='text-sm text-base-content/70'>Aucun poste assigné</p>
                                )}
                              </div>

                              {/* Dropdown pour assigner un nouveau poste */}
                              <div className='flex gap-2 items-center'>
                                <select
                                  className='select select-bordered select-sm flex-1'
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignPost(staff.id, e.target.value)
                                      e.target.value = ''
                                    }
                                  }}
                                  aria-label='Assigner un poste'
                                >
                                  <option value=''>Assigner un poste...</option>
                                  {posts
                                    .filter(post => !assignedPostsMap[staff.id]?.some(ap => ap.id === post.id))
                                    .map((post) => (
                                      <option key={post.id} value={post.id}>
                                        {post.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}

export default page
