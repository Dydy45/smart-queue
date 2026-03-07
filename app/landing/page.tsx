"use client"

import Link from "next/link"
import { AudioWaveform, CheckCircle2, Clock, Users, BarChart3, Shield, Smartphone, Zap, Building2, Hospital, Landmark, Scissors } from "lucide-react"
import { useState } from "react"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-services",
      description: "Gérez plusieurs services simultanément avec des temps de traitement personnalisés"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Tableau de bord",
      description: "Statistiques en temps réel pour optimiser vos performances"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Sécurité",
      description: "Authentification robuste avec gestion des rôles (Owner, Admin, Staff)"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Temps réel",
      description: "Mises à jour automatiques toutes les 5 secondes"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Responsive",
      description: "Fonctionne parfaitement sur tous les appareils"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Gain de temps",
      description: "Réduisez les temps d&apos;attente et améliorez la satisfaction client"
    }
  ]

  const useCases = [
    {
      icon: <Hospital className="w-12 h-12 text-primary" />,
      title: "Santé",
      examples: "Cabinets médicaux, Cliniques, Laboratoires",
      color: "bg-primary/10"
    },
    {
      icon: <Landmark className="w-12 h-12 text-secondary" />,
      title: "Administration",
      examples: "Mairies, Préfectures, Agences",
      color: "bg-secondary/10"
    },
    {
      icon: <Building2 className="w-12 h-12 text-accent" />,
      title: "Finance",
      examples: "Banques, Assurances, Comptables",
      color: "bg-accent/10"
    },
    {
      icon: <Scissors className="w-12 h-12 text-info" />,
      title: "Services",
      examples: "Salons, Garages, Ateliers",
      color: "bg-info/10"
    }
  ]

  const faqs = [
    {
      question: "Comment créer mon premier service ?",
      answer: "Après inscription, allez sur &apos;Vos services&apos;, cliquez sur &apos;Créer un service&apos;, renseignez le nom et le temps moyen de traitement. C&apos;est fait !"
    },
    {
      question: "Puis-je avoir plusieurs employés sur un même poste ?",
      answer: "Oui ! Vous pouvez assigner plusieurs employés (STAFF) à un même poste. Ils verront tous les tickets du service lié à ce poste."
    },
    {
      question: "Les données sont-elles sécurisées ?",
      answer: "Absolument. Nous utilisons Clerk pour l&apos;authentification (chiffrement de bout en bout) et Prisma ORM pour prévenir les injections SQL. Vos données sont stockées de manière sécurisée."
    },
    {
      question: "Puis-je personnaliser la page client ?",
      answer: "Oui, vous pouvez définir un nom de page personnalisé (ex: &apos;cabinet-medical&apos;) accessible via /page/votre-nom. Vos clients y accèdent pour créer leurs tickets."
    },
    {
      question: "Comment mes employés accèdent-ils à leurs postes ?",
      answer: "Chaque employé se connecte avec son email. Il voit automatiquement ses postes assignés sur la page d&apos;accueil et peut cliquer dessus pour traiter les tickets."
    },
    {
      question: "Y a-t-il une limite de tickets ?",
      answer: "Non, vous pouvez créer autant de tickets que nécessaire. Le système est conçu pour gérer des volumes importants avec des mises à jour en temps réel."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navbar simple */}
      <nav className="border-b border-base-300 px-5 md:px-[10%] py-4">
        <div className="flex justify-between items-center">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="rounded-full p-2 bg-primary/10">
              <AudioWaveform className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl">SmartQueue</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/sign-in" className="btn btn-ghost btn-sm">
              Connexion
            </Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-5 md:px-[10%] py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Gérez vos files d&apos;attente <span className="text-primary">intelligemment</span>
          </h1>
          <p className="text-xl text-base-content/70 mb-8">
            La solution complète pour optimiser l&apos;accueil de vos clients et améliorer l&apos;efficacité de votre équipe
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              Commencer gratuitement
            </Link>
            <a href="#video" className="btn btn-outline btn-lg">
              Voir la démo
            </a>
          </div>

          {/* Video Placeholder */}
          <div id="video" className="relative aspect-video bg-base-200 rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <div className="w-0 h-0 border-l-20 border-l-primary border-t-12 border-t-transparent border-b-12 border-b-transparent ml-2" />
              </div>
              <p className="text-lg font-semibold">Vidéo mode d&apos;emploi</p>
              <p className="text-sm text-base-content/60">Durée : 3-5 minutes</p>
              <p className="text-xs text-base-content/50 mt-2">(À venir - Intégrez votre vidéo ici)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="px-5 md:px-[10%] py-16 bg-base-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-error">Le problème</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-error mt-1">✗</span>
                  <span>Clients frustrés par les temps d&apos;attente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-1">✗</span>
                  <span>Personnel débordé et désorganisé</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-1">✗</span>
                  <span>Pas de visibilité sur la file d&apos;attente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-1">✗</span>
                  <span>Gestion manuelle inefficace</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4 text-success">La solution</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-success mt-1 flex shrink-0" />
                  <span>Digitalisation complète de la file d&apos;attente</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-success mt-1 flex shrink-0" />
                  <span>Organisation optimale du personnel</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-success mt-1 flex shrink-0" />
                  <span>Statistiques en temps réel</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-success mt-1 flex shrink-0" />
                  <span>Interface simple et intuitive</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 md:px-[10%] py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Fonctionnalités clés
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="text-primary mb-3">{feature.icon}</div>
                  <h3 className="card-title text-lg">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 md:px-[10%] py-16 bg-base-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-xl mb-2">Configurez</h3>
              <p className="text-base-content/70">
                Créez vos services et postes en 5 minutes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-xl mb-2">Partagez</h3>
              <p className="text-base-content/70">
                Donnez le lien de votre page publique à vos clients
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-xl mb-2">Gérez</h3>
              <p className="text-base-content/70">
                Vos employés traitent les tickets efficacement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-5 md:px-[10%] py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Parfait pour tous les secteurs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body items-center text-center">
                  <div className={`p-4 rounded-full ${useCase.color} mb-3`}>
                    {useCase.icon}
                  </div>
                  <h3 className="card-title text-lg">{useCase.title}</h3>
                  <p className="text-sm text-base-content/70">{useCase.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 md:px-[10%] py-16 bg-base-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="collapse collapse-plus bg-base-100 shadow">
                <input
                  type="radio"
                  name="faq-accordion"
                  checked={openFaq === index}
                  onChange={() => setOpenFaq(openFaq === index ? null : index)}
                />
                <div className="collapse-title text-lg font-medium">
                  {faq.question}
                </div>
                <div className="collapse-content">
                  <p className="text-base-content/70">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-5 md:px-[10%] py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Prêt à optimiser votre gestion de file d&apos;attente ?
          </h2>
          <p className="text-xl text-base-content/70 mb-8">
            Rejoignez les entreprises qui ont déjà amélioré leur efficacité avec SmartQueue
          </p>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-300 px-5 md:px-[10%] py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <AudioWaveform className="w-5 h-5 text-primary" />
              <span className="font-semibold">SmartQueue</span>
            </div>
            <p className="text-sm text-base-content/60">
              © 2026 SmartQueue. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/landing" className="hover:text-primary transition-colors">
                Accueil
              </Link>
              <Link href="#video" className="hover:text-primary transition-colors">
                Démo
              </Link>
              <Link href="/sign-up" className="hover:text-primary transition-colors">
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
