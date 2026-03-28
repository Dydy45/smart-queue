"use client"

import Link from "next/link"
import {
  AudioWaveform,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  Zap,
  Building2,
  Hospital,
  Landmark,
  Scissors,
  ArrowRight,
  Star,
  Menu,
  X,
  ChevronRight,
  Ticket,
  UserCheck,
  Globe,
} from "lucide-react"
import { useState } from "react"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#how-it-works", label: "Comment ça marche" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#faq", label: "FAQ" },
  ]

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gestion multi-services",
      description: "Créez et gérez plusieurs services avec des temps de traitement personnalisés pour chaque file."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Tableau de bord analytique",
      description: "Visualisez les performances en temps réel : tickets traités, temps moyen, taux de satisfaction."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité & rôles",
      description: "Système de permissions granulaire avec 3 niveaux : Propriétaire, Administrateur, Employé."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Mises à jour temps réel",
      description: "Les files se mettent à jour automatiquement toutes les 5 secondes, sans rafraîchir la page."
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "100% responsive",
      description: "Interface optimisée pour mobile, tablette et desktop. Vos clients et employés accèdent de partout."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Estimation des temps",
      description: "Chaque client voit son temps d&apos;attente estimé en temps réel, réduisant la frustration."
    }
  ]

  const steps = [
    {
      icon: <Ticket className="w-7 h-7" />,
      title: "Créez vos services",
      description: "Définissez vos services (consultation, guichet, rdv...) avec un temps moyen de traitement."
    },
    {
      icon: <UserCheck className="w-7 h-7" />,
      title: "Assignez vos équipes",
      description: "Créez des postes, invitez vos employés et assignez-les aux services appropriés."
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "Partagez votre page",
      description: "Vos clients accèdent à votre page publique personnalisée pour prendre un ticket en un clic."
    }
  ]

  const useCases = [
    {
      icon: <Hospital className="w-10 h-10" />,
      title: "Santé",
      examples: ["Cabinets médicaux", "Cliniques", "Laboratoires"],
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: <Landmark className="w-10 h-10" />,
      title: "Administration",
      examples: ["Mairies", "Préfectures", "Agences"],
      color: "text-secondary",
      bg: "bg-secondary/10"
    },
    {
      icon: <Building2 className="w-10 h-10" />,
      title: "Finance",
      examples: ["Banques", "Assurances", "Comptables"],
      color: "text-accent",
      bg: "bg-accent/10"
    },
    {
      icon: <Scissors className="w-10 h-10" />,
      title: "Services",
      examples: ["Salons de coiffure", "Garages auto", "Ateliers"],
      color: "text-info",
      bg: "bg-info/10"
    }
  ]

  const pricingPlans = [
    {
      name: "Gratuit",
      price: "0",
      description: "Idéal pour tester la plateforme et les petites structures.",
      features: [
        "1 service",
        "1 poste",
        "Page publique personnalisée",
        "Tableau de bord basique",
      ],
      cta: "Commencer gratuitement",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "29",
      oldPrice: "49",
      description: "Pour les entreprises qui veulent aller plus loin.",
      features: [
        "Services illimités",
        "Jusqu\u0027à 10 postes",
        "Gestion des rôles (Admin, Staff)",
        "Statistiques avancées",
        "Support prioritaire",
      ],
      cta: "Essayer 14 jours gratuit",
      highlighted: true,
    },
    {
      name: "Entreprise",
      price: "79",
      oldPrice: "129",
      description: "Solution complète pour les grandes organisations.",
      features: [
        "Tout du plan Pro",
        "Postes illimités",
        "Multi-sites",
        "API & intégrations",
        "Support dédié 24/7",
        "Formation personnalisée",
      ],
      cta: "Contacter l\u0027équipe",
      highlighted: false,
    }
  ]

  const faqs = [
    {
      question: "Comment créer mon premier service ?",
      answer: "Après inscription, accédez à « Vos services », cliquez sur « Créer un service », renseignez le nom et le temps moyen de traitement. Votre service est prêt en moins d\u0027une minute !"
    },
    {
      question: "Puis-je avoir plusieurs employés sur un même poste ?",
      answer: "Oui ! Vous pouvez assigner plusieurs employés (STAFF) à un même poste. Ils verront tous les tickets du service lié à ce poste et pourront les traiter en parallèle."
    },
    {
      question: "Les données sont-elles sécurisées ?",
      answer: "Absolument. Nous utilisons Clerk pour l\u0027authentification avec chiffrement de bout en bout, et Prisma ORM pour prévenir les injections SQL. Vos données sont stockées de manière sécurisée et conforme au RGPD."
    },
    {
      question: "Puis-je personnaliser la page client ?",
      answer: "Oui, vous pouvez définir un nom de page personnalisé (ex : « cabinet-medical ») accessible via /page/votre-nom. Vos clients y accèdent directement pour prendre un ticket."
    },
    {
      question: "Comment mes employés accèdent-ils à leurs postes ?",
      answer: "Chaque employé se connecte avec son email. Il voit automatiquement ses postes assignés sur la page d\u0027accueil et peut cliquer dessus pour commencer à traiter les tickets."
    },
    {
      question: "Y a-t-il une limite de tickets ?",
      answer: "Non, vous pouvez gérer autant de tickets que nécessaire. Le système est conçu pour supporter des volumes importants avec des mises à jour en temps réel."
    }
  ]

  return (
    <div className="min-h-screen bg-base-100">

      {/* ===== NAVBAR ===== */}
      <nav className="navbar sticky top-0 z-50 bg-base-100/80 backdrop-blur-lg border-b border-base-200 px-5 md:px-[10%]">
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="SmartQueue - Accueil">
            <div className="rounded-xl p-2 bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <AudioWaveform className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">SmartQueue</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="btn btn-ghost btn-sm font-normal text-base-content/70 hover:text-base-content"
            >
              {link.label}
            </a>
          ))}
          <div className="divider divider-horizontal mx-1" />
          <Link href="/sign-in" className="btn btn-ghost btn-sm">
            Connexion
          </Link>
          <Link href="/sign-up" className="btn btn-primary btn-sm">
            Essayer gratuitement
          </Link>
        </div>

        <button
          className="btn btn-ghost btn-sm md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-base-100 border-b border-base-200 shadow-lg md:hidden p-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="btn btn-ghost justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="divider my-1" />
            <Link href="/sign-in" className="btn btn-ghost justify-start">
              Connexion
            </Link>
            <Link href="/sign-up" className="btn btn-primary">
              Essayer gratuitement
            </Link>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden px-5 md:px-[10%] pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Star className="w-4 h-4 fill-primary" />
            <span>Solution #1 de gestion de files d&apos;attente</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Transformez vos{" "}
            <span className="text-primary">files d&apos;attente</span>{" "}
            en expérience fluide
          </h1>

          <p className="text-lg md:text-xl text-base-content/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Digitalisez la gestion de vos files d&apos;attente, optimisez votre organisation
            et offrez à vos clients une expérience d&apos;accueil exceptionnelle.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/sign-up" className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/25">
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg gap-2">
              Découvrir comment ça marche
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* Dashboard mockup */}
          <div className="relative mx-auto max-w-4xl">
            <div className="rounded-xl border border-base-300 bg-base-200 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300 bg-base-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-base-200 rounded-md px-4 py-1 text-xs text-base-content/40 font-mono">
                    smartqueue.app/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-base-100 rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">127</div>
                    <div className="text-xs text-base-content/50 mt-1">Tickets aujourd&apos;hui</div>
                  </div>
                  <div className="bg-base-100 rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-success">4 min</div>
                    <div className="text-xs text-base-content/50 mt-1">Temps moyen</div>
                  </div>
                  <div className="bg-base-100 rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-secondary">98%</div>
                    <div className="text-xs text-base-content/50 mt-1">Satisfaction</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-base-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="badge badge-primary badge-sm">#{String(i).padStart(3, "0")}</div>
                        <div className="h-2.5 bg-base-300 rounded-full w-24 md:w-32" />
                      </div>
                      <div className="badge badge-success badge-outline badge-sm">En cours</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM / SOLUTION ===== */}
      <section className="px-5 md:px-[10%] py-20 bg-base-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi SmartQueue ?
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Découvrez comment nous transformons un problème quotidien en avantage compétitif.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card bg-base-100 border border-error/20 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-error text-xl mb-4">
                  Sans SmartQueue
                </h3>
                <ul className="space-y-3">
                  {[
                    "Clients frustrés par des temps d\u0027attente imprévisibles",
                    "Personnel débordé et désorganisé",
                    "Aucune visibilité sur l\u0027état de la file",
                    "Gestion manuelle source d\u0027erreurs",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      <span className="text-base-content/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card bg-base-100 border border-success/20 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-success text-xl mb-4">
                  Avec SmartQueue
                </h3>
                <ul className="space-y-3">
                  {[
                    "Digitalisation complète avec estimation des temps",
                    "Organisation optimale du personnel par poste",
                    "Statistiques et visibilité en temps réel",
                    "Interface intuitive, zéro formation requise",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-base-content/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="px-5 md:px-[10%] py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Des fonctionnalités puissantes pensées pour simplifier votre quotidien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="card-body">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-content transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="card-title text-lg">{feature.title}</h3>
                  <p className="text-base-content/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="px-5 md:px-[10%] py-20 bg-base-200/50 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt en 3 étapes
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Configurez votre système de gestion de files d&apos;attente en quelques minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-primary/20" aria-hidden="true" />

            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25 relative z-10">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:left-[calc(50%+16px)] md:-top-1 w-7 h-7 rounded-full bg-base-100 border-2 border-primary text-primary text-xs font-bold flex items-center justify-center z-20">
                  {index + 1}
                </div>
                <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-base-content/60 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="px-5 md:px-[10%] py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Adapté à tous les secteurs
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Quelle que soit votre activité, SmartQueue s&apos;adapte à vos besoins.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="card bg-base-100 border border-base-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="card-body items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl ${useCase.bg} ${useCase.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {useCase.icon}
                  </div>
                  <h3 className="font-bold text-lg">{useCase.title}</h3>
                  <ul className="text-sm text-base-content/60 space-y-1">
                    {useCase.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="px-5 md:px-[10%] py-20 bg-base-200/50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tarifs transparents
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Des prix flexibles, sans frais cachés. Évoluez selon vos besoins.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`card bg-base-100 border shadow-sm transition-all duration-300 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-primary shadow-primary/10 scale-[1.02] md:scale-105"
                    : "border-base-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-primary-content text-center py-2 text-sm font-semibold rounded-t-2xl">
                    Le plus populaire
                  </div>
                )}
                <div className="card-body">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-base-content/60 mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    {plan.oldPrice && (
                      <span className="text-base-content/40 line-through text-lg">${plan.oldPrice}</span>
                    )}
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className="text-base-content/50 text-sm">/mois</span>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-base-content/70">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/sign-up"
                    className={`btn w-full ${plan.highlighted ? "btn-primary" : "btn-outline"}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="px-5 md:px-[10%] py-20 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions fréquentes
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Tout ce que vous devez savoir pour bien démarrer avec SmartQueue.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-xl"
              >
                <input
                  type="radio"
                  name="faq-accordion"
                  checked={openFaq === index}
                  onChange={() => setOpenFaq(openFaq === index ? null : index)}
                />
                <div className="collapse-title font-semibold text-base">
                  {faq.question}
                </div>
                <div className="collapse-content">
                  <p className="text-base-content/60 text-sm leading-relaxed pt-1">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="px-5 md:px-[10%] py-20">
        <div className="max-w-4xl mx-auto">
          <div className="card bg-primary text-primary-content overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" aria-hidden="true">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white rounded-full" />
            </div>
            <div className="card-body items-center text-center py-14 px-8 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à transformer votre accueil ?
              </h2>
              <p className="text-primary-content/80 max-w-xl mb-8 leading-relaxed">
                Rejoignez les entreprises qui ont déjà optimisé leur gestion de files d&apos;attente avec SmartQueue. Inscription gratuite, sans engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sign-up" className="btn btn-secondary btn-lg gap-2 shadow-lg">
                  Créer mon compte gratuit
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-base-200 bg-base-100">
        <div className="max-w-6xl mx-auto px-5 md:px-[10%] py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="rounded-xl p-2 bg-primary/10">
                  <AudioWaveform className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-lg">SmartQueue</span>
              </Link>
              <p className="text-sm text-base-content/50 leading-relaxed">
                La solution intelligente pour gérer vos files d&apos;attente et optimiser votre accueil.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-base-content/60 hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-base-content/60 hover:text-primary transition-colors">Tarifs</a></li>
                <li><a href="#faq" className="text-base-content/60 hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sign-up" className="text-base-content/60 hover:text-primary transition-colors">Inscription</Link></li>
                <li><Link href="/sign-in" className="text-base-content/60 hover:text-primary transition-colors">Connexion</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="text-base-content/60 hover:text-primary transition-colors">Centre d&apos;aide</a></li>
                <li><a href="#how-it-works" className="text-base-content/60 hover:text-primary transition-colors">Guide de démarrage</a></li>
              </ul>
            </div>
          </div>

          <div className="divider my-0" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
            <p className="text-xs text-base-content/40">
              © {new Date().getFullYear()} SmartQueue. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-xs text-base-content/40">
              <a href="#" className="hover:text-base-content transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-base-content transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-base-content transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
