// Script temporaire pour assigner un staff à un poste
// Usage: npx tsx assign_staff_to_post.ts

import prisma from './lib/prisma.js'

async function assignStaffToPost() {
  try {
    // Valeurs configurées
    const staffEmail = 'ndjokodylan8@gmail.com' // Email du staff
    const postName = 'caisse' // Nom du poste

    // Trouver le staff
    const staff = await prisma.staff.findFirst({
      where: { email: staffEmail }
    })

    if (!staff) {
      console.error('❌ Staff non trouvé avec cet email')
      return
    }

    // Trouver le poste par nom
    const post = await prisma.post.findFirst({
      where: { 
        name: postName,
        companyId: staff.companyId
      }
    })

    if (!post) {
      console.error('❌ Poste non trouvé')
      console.log('Postes disponibles :')
      const posts = await prisma.post.findMany({
        where: { companyId: staff.companyId },
        select: { id: true, name: true }
      })
      console.table(posts)
      return
    }

    // Assigner le poste au staff
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        assignedPosts: {
          connect: { id: post.id }
        }
      }
    })

    console.log('✅ Staff assigné au poste avec succès !')
    console.log(`Staff: ${staff.name} (${staff.email})`)
    console.log(`Poste: ${post.name}`)

    // Vérifier l'assignation
    const updatedStaff = await prisma.staff.findUnique({
      where: { id: staff.id },
      include: { assignedPosts: true }
    })

    console.log('\nPostes assignés :')
    console.table(updatedStaff?.assignedPosts)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignStaffToPost()
