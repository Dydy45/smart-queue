/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { MaintenanceMode, Post, Service } from '@/app/generated/prisma'
import { createPost, deletePost, getPostsByCompanyEmail, getServiceByEmail } from '../actions'
import { activateMaintenanceMode, deactivateMaintenanceMode, getActiveMaintenanceModes } from '../actions/maintenance'
import { Trash, Pause, Play } from 'lucide-react'
import EmptyState from "../components/EmptyState";
import Link from 'next/link'
import { usePageTour } from '@/lib/usePageTour'
import SkeletonCards from '../components/SkeletonCards'
import { useToast } from '@/lib/useToast'

const page = () => {

  const {user} = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string
  const { showError, showSuccess } = useToast()

  const [newPostName, setNewPostName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loading, setLoading] = useState<boolean>(false)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)

  const [posts, setPosts] = useState<Post[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [maintenanceModes, setMaintenanceModes] = useState<MaintenanceMode[]>([])
  const [togglingMaintenance, setTogglingMaintenance] = useState<string | null>(null)

  usePageTour('postes', [
    {
      element: '#tour-post-form',
      popover: {
        title: 'Créez votre premier poste',
        description: 'Sélectionnez le <strong>service associé</strong>, donnez un <strong>nom au poste</strong> (ex. Guichet 1, Cabinet Dr. Martin), puis cliquez sur <em>Créer le poste</em>.<br><br>Vous pourrez ensuite assigner ce poste à un employé depuis la section Staff.',
        side: 'right',
        align: 'start',
      },
    },
  ], !!email)

  const fetchPosts = async () => {
    if(email){
      try {
        const result = await getPostsByCompanyEmail(email)
        if(result){
          setPosts(result)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  const fetchServices = async () => {
    if(email){
      try {
        const result = await getServiceByEmail(email)
        if(result){
          setServices(result)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  const fetchInitialData = async () => {
    await Promise.all([fetchPosts(), fetchServices()])
    setIsInitialLoad(false)
  }

  const fetchMaintenanceModes = async () => {
    if (!email) return
    try {
      const modes = await getActiveMaintenanceModes(email)
      setMaintenanceModes(modes || [])
    } catch (error) {
      console.error("Error fetching maintenance modes:", error)
    }
  }

  const isPostInMaintenance = (postId: string) => {
    return maintenanceModes.some(m => m.postId === postId)
  }

  const handleToggleMaintenance = async (postId: string) => {
    if (!email) return
    setTogglingMaintenance(postId)
    try {
      const existing = maintenanceModes.find(m => m.postId === postId)
      if (existing) {
        await deactivateMaintenanceMode(existing.id)
        showSuccess('Maintenance désactivée')
      } else {
        const reason = prompt('Raison de la maintenance (optionnel) :')
        await activateMaintenanceMode(postId, 'post', reason || undefined)
        showSuccess('Maintenance activée - Les clients en attente seront notifiés')
      }
      await fetchMaintenanceModes()
    } catch (error) {
      console.error("Error toggling maintenance:", error)
      showError(error instanceof Error ? error.message : 'Erreur lors de la modification de la maintenance')
    } finally {
      setTogglingMaintenance(null)
    }
  }

  const handleCreatePost = async() => {
    if(!newPostName || !selectedServiceId) return
    setLoading(true)

    try {
      await createPost(email, newPostName, selectedServiceId)
      setLoading(false)
      setNewPostName("")
      setSelectedServiceId("")
      fetchPosts()
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  useEffect (() => {
    if (email) {
      fetchInitialData()
      fetchMaintenanceModes()
    }
  } , [email])

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId)
      fetchPosts()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Wrapper>
      <h1 className='text-2xl font-bold mb-4'>Liste des postes</h1>
      <div className='flex flex-col md:flex-row'>
        <div id="tour-post-form" className='space-y-2 mr-4'>
          <select
            className='select select-bordered select-sm w-full'
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            aria-label="Service du poste"
          >
            <option value="" disabled>Sélectionner un service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <input 
          type="text"
          placeholder='Nom du poste'
          className='input input-bordered input-sm w-full'
          value={newPostName}
          onChange={(e) => setNewPostName(e.target.value)}
          aria-label="Nom du poste"
          />
          <button className='btn btn-primary btn-sm' onClick={handleCreatePost} disabled={loading || !selectedServiceId}>
            {loading ? (
              <><span className='loading loading-spinner loading-sm' role="status" aria-label="Chargement"></span>Création...</>
            ) : 'Créer le poste'}
          </button>
        </div>
        <ul className='mt-4 md:mt-0 w-full grid md:grid-cols-3 gap-4'>
          {isInitialLoad ? (
            <SkeletonCards count={3} />
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <li key={post.id} className='flex flex-col bg-base-200 p-5 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <div className='lowercase'>
                    {post.name}
                    {isPostInMaintenance(post.id) && (
                      <span className="badge badge-warning badge-xs ml-2">Maintenance</span>
                    )}
                  </div>
                  <button
                    className={`btn btn-xs ${isPostInMaintenance(post.id) ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => handleToggleMaintenance(post.id)}
                    disabled={togglingMaintenance === post.id}
                    aria-label={isPostInMaintenance(post.id) ? `Réactiver ${post.name}` : `Mettre en pause ${post.name}`}
                  >
                    {togglingMaintenance === post.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : isPostInMaintenance(post.id) ? (
                      <Play className="w-3 h-3" />
                    ) : (
                      <Pause className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className='flex items-center mt-2'>
                  <Link href={`/poste/${post.id}`} className='btn btn-sm btn-primary'>
                    Traiter des tickets
                  </Link>
                  <button className='btn btn-sm btn-primary btn-outline ml-2' onClick={() => handleDeletePost(post.id)} aria-label={`Supprimer le poste ${post.name}`}>
                    <Trash className='w-4 h-4' />
                  </button>
                </div>
              </li>
            ))
          ) : (
            <div className='flex justify-center items-center w-full col-span-3'>
              <EmptyState IconComponent={'UserRoundCog'} message={'Aucun poste pour le moment'} />
            </div>
          )}
        </ul>
      </div>
    </Wrapper>
  )
}

export default page
