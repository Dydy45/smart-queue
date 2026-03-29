/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Post, Service } from '@/app/generated/prisma'
import { createPost, deletePost, getPostsByCompanyEmail, getServiceByEmail } from '../actions'
import { Trash } from 'lucide-react'
import EmptyState from "../components/EmptyState";
import Link from 'next/link'
import { usePageTour } from '@/lib/usePageTour'

const page = () => {

  const {user} = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string

  const [newPostName, setNewPostName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loading, setLoading] = useState<boolean>(false)

  const [posts, setPosts] = useState<Post[]>([])
  const [services, setServices] = useState<Service[]>([])

  usePageTour('postes', [
    {
      element: '#tour-post-form',
      popover: {
        title: '③ Créez votre premier poste',
        description: 'Sélectionnez le <b>service associé</b>, donnez un <b>nom au poste</b> (ex : <em>Guichet 1</em>), puis cliquez sur « Créer le poste ».<br><br>Un poste peut ensuite être assigné à un employé depuis la section <b>Staff</b>.',
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
    fetchPosts()
    fetchServices()
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
          {posts.length > 0 ? (
            posts.map((post) => (
              <li key={post.id} className='flex flex-col bg-base-200 p-5 rounded-lg'>
                <div className='lowercase'>
                  {post.name}
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
