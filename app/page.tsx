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
  Landmark,
  ArrowRight,
  Star,
  Menu,
  X,
  ChevronRight,
  Ticket,
  UserCheck,
  Globe,
  GraduationCap,
  BookOpen,
  FileText,
  BadgeCheck,
  CalendarDays,
} from "lucide-react"
import { useState } from "react"

const ISS_PAGE_NAME = 'iss'

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#how-it-works", label: "Comment ça marche" },
    { href: "#services", label: "Nos services" },
    { href: "#faq", label: "FAQ" },
  ]

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-services universitaires",
      description: "Scolarité, Finance, Bibliothèque, Examens — chaque département gère sa propre file d’attente.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Tableau de bord analytique",
      description: "Visualisez les flux en temps réel : tickets traités, temps d’attente moyen, charge par service.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Accès sécurisé par rôle",
      description: "3 niveaux d’accès distincts : Direction (DSI), Responsable de service, Agent de guichet.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Temps réel sans rechargement",
      description: "Les files se mettent à jour automatiquement toutes les 5 secondes sur tous les écrans.",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Ticket depuis son smartphone",
      description: "Les étudiants prennent leur ticket en ligne et arrivent juste à temps, sans faire la queue.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Estimation du temps d’attente",
      description: "Chaque étudiant voit son temps d’attente estimé, éliminant l’incertitude et la frustration.",
    }
  ]

  const steps = [
    {
      icon: <Ticket className="w-7 h-7" />,
      title: "Configurer les services",
      description: "La DSI définit les services administratifs (Scolarité, Finance…) et les guichets de traitement.",
    },
    {
      icon: <UserCheck className="w-7 h-7" />,
      title: "Affecter les agents",
      description: "Les responsables assignent les agents administratifs à leurs postes de travail spécifiques.",
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "Les étudiants prennent un ticket",
      description: "Via l’URL publique ISS/KIN, les étudiants rejoignent la file et suivent leur position en temps réel.",
    }
  ]

  const useCases = [
    {
      icon: <GraduationCap className="w-10 h-10" />,
      title: "Scolarité",
      examples: ["Inscriptions & réinscriptions", "Relevés de notes", "Attestations"],
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: <Landmark className="w-10 h-10" />,
      title: "Finance",
      examples: ["Frais académiques", "Quittances de paiement", "Bourses étudiantes"],
      color: "text-secondary",
      bg: "bg-secondary/10"
    },
    {
      icon: <BookOpen className="w-10 h-10" />,
      title: "Bibliothèque",
      examples: ["Prêt de documents", "Réservations", "Retours & prolongations"],
      color: "text-accent",
      bg: "bg-accent/10"
    },
    {
      icon: <FileText className="w-10 h-10" />,
      title: "Examens",
      examples: ["Affichage des résultats", "Réclamations", "Attestations de réussite"],
      color: "text-info",
      bg: "bg-info/10"
    }
  ]

  const accessRoles = [
    {
      badge: "DSI / Direction",
      role: "OWNER",
      color: "badge-primary",
      border: "border-primary/20",
      description: "Configuration globale du système, gestion de tous les services, agents et analytiques.",
      perks: ["Services illimités", "Postes illimités", "Gestion des comptes agents", "Analytics institutionnels"],
    },
    {
      badge: "Responsable de service",
      role: "ADMIN",
      color: "badge-secondary",
      border: "border-secondary/20",
      description: "Gestion de son département : postes, agents assignés et suivi de la charge.",
      perks: ["Gestion de son service", "Affectation des agents", "Statistiques du service", "Rendez-vous planifiés"],
      highlighted: true,
    },
    {
      badge: "Agent administratif",
      role: "STAFF",
      color: "badge-accent",
      border: "border-accent/20",
      description: "Traitement des tickets sur ses postes assignés, appel des étudiants en file.",
      perks: ["Vue de ses postes assignés", "Appel du ticket suivant", "Historique des traitements", "Interface mobile-first"],
    },
  ]

  const faqs = [
    {
      question: "Comment un étudiant prend-il un ticket ?",
      answer: "L’étudiant accède à l’URL publique ISS/KIN depuis son smartphone ou un ordinateur. Il sélectionne le service souhaité (ex : Scolarité), saisit son nom, et reçoit instantanément un numéro de ticket avec le temps d’attente estimé.",
    },
    {
      question: "Les agents administratifs voient-ils tous les tickets de l’ISS/KIN ?",
      answer: "Non : chaque agent ne voit que les tickets des postes qui lui sont assignés par son responsable de service. Cela garantit la confidentialité et la bonne organisation par département.",
    },
    {
      question: "Les données des étudiants sont-elles sécurisées ?",
      answer: "Oui. Le système utilise Clerk pour l’authentification avec chiffrement de bout en bout, et Prisma ORM pour prévenir les injections SQL. Seuls les membres autorisés de l’ISS/KIN accèdent aux données.",
    },
    {
      question: "Comment fonctionne l’écran d’affichage en salle d’attente ?",
      answer: "La DSI configure une URL publique unique (ex : « iss-kin »). L’URL de display est projetée sur un écran TV en salle d’attente et se met à jour en temps réel, affichant le numéro appelé et le guichet correspondant.",
    },
    {
      question: "Un responsable de service peut-il gérer plusieurs départements ?",
      answer: "Actuellement un compte ADMIN gère le périmètre que lui a accordé la Direction. La Direction (OWNER) a, elle, une vue globale sur l’ensemble des services et des statistiques de l’institution.",
    },
    {
      question: "Peut-on prendre un rendez-vous en dehors des heures d’affluence ?",
      answer: "Oui ! En plus des tickets instantanés, le système propose un module de rendez-vous planifiés. Les étudiants choisissent un créneau et reçoivent une confirmation, évitant ainsi les pics d’affluence.",
    }
  ]

  return (
    <div className="min-h-screen bg-base-100">

      {/* ===== NAVBAR ===== */}
      <nav className="navbar sticky top-0 z-50 bg-base-100/80 backdrop-blur-lg border-b border-base-200 px-5 md:px-[10%]">
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="SmartQueue ISS/KIN - Accueil">
            <div className="rounded-xl p-2 bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <AudioWaveform className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base tracking-tight leading-none">SmartQueue</span>
              <span className="text-xs text-primary/70 font-semibold leading-none tracking-wide">ISS/KIN</span>
            </div>
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
          <Link href="/sign-in" className="btn btn-primary btn-sm">
            Accéder au portail
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
            <Link href="/sign-in" className="btn btn-primary">
              Accéder au portail
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
            <span>Système officiel de gestion des files d’attente — ISS/KIN</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Fluidifiez les{" "}
            <span className="text-primary">services administratifs</span>{" "}
            de l&apos;ISS/KIN
          </h1>

          <p className="text-lg md:text-xl text-base-content/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartQueue ISS/KIN digitalise et organise les files d&apos;attente de tous vos services
            — Scolarité, Finance, Bibliothèque — pour une expérience étudiante modernisée.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/sign-in" className="btn btn-ghost btn-lg gap-2">
              Accéder au portail
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg gap-2">
              Découvrir comment ça marche
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* Accès rapide étudiants */}
          <div className="inline-block bg-base-100 border border-base-300 rounded-2xl shadow-lg px-6 py-5 mb-16">
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-widest mb-4">Vous êtes étudiant ISS/KIN ?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/page/${ISS_PAGE_NAME}`}
                className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/25"
              >
                <Ticket className="w-5 h-5" />
                Prendre un ticket
              </Link>
              <Link
                href={`/appointment/${ISS_PAGE_NAME}`}
                className="btn btn-outline btn-lg gap-2"
              >
                <CalendarDays className="w-5 h-5" />
                Prendre rendez-vous
              </Link>
            </div>
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
                    iss-kin.smartqueue.app/home
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
              Pourquoi SmartQueue ISS/KIN ?
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Voyez concrètement ce que le système change pour les étudiants et le personnel administratif.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card bg-base-100 border border-error/20 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-error text-xl mb-4">
                  Sans SmartQueue ISS/KIN
                </h3>
                <ul className="space-y-3">
                  {[
                    "Étudiants frustrés par des files imprévisibles",
                    "Agents surchargés sans visibilité sur la charge",
                    "Aucune traçabilité des demandes administratives",
                    "Gestion papier source d’erreurs et de litiges",
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
                  Avec SmartQueue ISS/KIN
                </h3>
                <ul className="space-y-3">
                  {[
                    "Ticket numérique en ligne avec estimation du temps",
                    "Agents organisés par poste avec visibilité en temps réel",
                    "Historique complet de toutes les demandes",
                    "Interface intuitive, déploiement en quelques minutes",
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
              Conçu pour l’université
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Des fonctionnalités pensées spécifiquement pour les besoins administratifs de l’ISS/KIN.
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
              Opérationnel en 3 étapes
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              La DSI configure l’espace en quelques minutes. Les services sont immédiatement actifs.
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
              Nos services administratifs
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Chaque département de l’ISS/KIN dispose de sa propre file gérée indépendamment.
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

      {/* ===== ACCÈS INSTITUTIONNEL ===== */}
      <section id="acces" className="px-5 md:px-[10%] py-20 bg-base-200/50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Accès réservé à l&apos;ISS/KIN
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Ce système est exclusivement destiné aux membres de l’Institut Supérieur des Statistiques de Kinshasa.
              Chaque profil dispose d’un périmètre d’accès adapté à ses responsabilités.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {accessRoles.map((item, index) => (
              <div
                key={index}
                className={`card bg-base-100 border shadow-sm transition-all duration-300 hover:shadow-lg ${
                  item.highlighted
                    ? "border-secondary shadow-secondary/10 scale-[1.02] md:scale-105"
                    : item.border
                }`}
              >
                {item.highlighted && (
                  <div className="bg-secondary text-secondary-content text-center py-2 text-sm font-semibold rounded-t-2xl">
                    Responsable de service
                  </div>
                )}
                <div className="card-body">
                  <span className={`badge ${item.color} badge-lg self-start mb-2`}>{item.role}</span>
                  <h3 className="text-xl font-bold">{item.badge}</h3>
                  <p className="text-sm text-base-content/60 mb-4">{item.description}</p>
                  <ul className="space-y-2.5 flex-1">
                    {item.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <BadgeCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-base-content/70">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/sign-in" className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/25">
              Accéder au portail ISS/KIN
              <ArrowRight className="w-5 h-5" />
            </Link>
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
              Tout ce que les étudiants et le personnel de l’ISS/KIN doivent savoir sur le système.
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
                Prêt à moderniser les services ISS/KIN ?
              </h2>
              <p className="text-primary-content/80 max-w-xl mb-8 leading-relaxed">
                Connectez-vous au portail SmartQueue ISS/KIN pour gérer vos services, vos agents et suivre les files d&apos;attente en temps réel.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sign-in" className="btn btn-secondary btn-lg gap-2 shadow-lg">
                  Se connecter au portail
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
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-base leading-none">SmartQueue</span>
                  <span className="text-xs text-primary/70 font-semibold leading-none">ISS/KIN</span>
                </div>
              </Link>
              <p className="text-sm text-base-content/50 leading-relaxed">
                Système de gestion de files d’attente de l’Institut Supérieur des Statistiques de Kinshasa.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Système</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-base-content/60 hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#services" className="text-base-content/60 hover:text-primary transition-colors">Nos services</a></li>
                <li><a href="#faq" className="text-base-content/60 hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Portail */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Portail</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sign-in" className="text-base-content/60 hover:text-primary transition-colors">Connexion</Link></li>
                <li><a href="#acces" className="text-base-content/60 hover:text-primary transition-colors">Niveaux d&apos;accès</a></li>
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
              © {new Date().getFullYear()} SmartQueue ISS/KIN — Institut Supérieur des Statistiques de Kinshasa.
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
