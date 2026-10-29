import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  CheckCircle2,
  Droplets,
  Gift,
  Heart,
  House,
  MapPin,
  Mail,
  Menu,
  Pill,
  Phone,
  Share2,
  Shirt,
  ShieldCheck,
  Soup,
  Users,
  X,
} from "lucide-react";

const donationOptions = [5, 10, 25, 50];
const helpCategories = [
  { id: "agua", title: "Doar água", button: "Quero doar água", phrase: "Uma coisa tão simples para você pode ser essencial para a vida de outra pessoa.", icon: Droplets, physical: true, instructions: "Recebemos água potável lacrada. Confirme por telefone os pontos e horários de entrega antes de levar os itens." },
  { id: "comida", title: "Doar comida", button: "Quero doar alimentos", phrase: "Sua contribuição pode ajudar a colocar comida na mesa de quem mais precisa.", icon: Soup, physical: true, instructions: "Aceitamos alimentos não perecíveis dentro da validade. Fale com a equipe para confirmar os itens e o local de recebimento." },
  { id: "roupas", title: "Doar roupas", button: "Quero doar roupas", phrase: "Uma roupa que você pode compartilhar pode trazer conforto e dignidade para alguém.", icon: Shirt, physical: true, instructions: "As roupas devem estar limpas e em bom estado. Ligue antes para saber tamanhos e pontos de recebimento." },
  { id: "brinquedos", title: "Doar brinquedos", button: "Quero doar brinquedos", phrase: "Toda criança merece ter espaço para brincar, sorrir e sonhar.", icon: Gift, physical: true, instructions: "Recebemos brinquedos limpos, seguros e completos. Confirme previamente o local de entrega." },
  { id: "saude", title: "Ajudar com medicamentos e saúde", button: "Quero ajudar na saúde", phrase: "Cuidar da saúde também é uma forma de cuidar da vida.", icon: Pill, physical: false, instructions: "A contribuição financeira apoia iniciativas de saúde com destinação transparente, respeitando as regras aplicáveis a medicamentos." },
  { id: "abrigo", title: "Ajudar com moradia e abrigo", button: "Quero ajudar com abrigo", phrase: "Um lugar seguro para ficar pode representar o começo de uma nova etapa.", icon: House, physical: false, instructions: "A contribuição apoia projetos de acolhimento e necessidades emergenciais informadas pela campanha." },
  { id: "livre", title: "Doação livre", button: "Fazer uma doação livre", phrase: "Você escolhe como contribuir. O importante é fazer a diferença de acordo com suas possibilidades.", icon: Heart, physical: false, instructions: "Escolha o valor que desejar. A doação será direcionada à finalidade geral informada pela campanha." },
];
const reminderMessages = [
  "Hoje, uma escolha sua pode virar cuidado para alguém que está precisando. Se puder, doe o valor que cabe no seu coração.",
  "Enquanto uma família enfrenta um momento difícil, sua solidariedade pode levar acolhimento, cuidado e esperança.",
  "Seu gesto pode parecer pequeno, mas pode significar muito para quem está esperando uma ajuda. Escolha como participar.",
  "Se não puder doar agora, compartilhar esta campanha também pode fazer a ajuda chegar a quem precisa.",
];

type PixPayment = {
  id: string;
  status: string;
  amountCents: number;
  qrCodeBase64?: string;
  copyPaste?: string;
  paymentLink?: string;
  expiresAt?: string;
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState(helpCategories[6]);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderIndex, setReminderIndex] = useState(0);
  const [shareMessage, setShareMessage] = useState("");
  const [payment, setPayment] = useState<PixPayment | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [copied, setCopied] = useState(false);
  const remindersDismissed = useRef(false);
  const createPixMutation = trpc.payments.createPix.useMutation();
  const paymentStatusQuery = trpc.payments.status.useQuery(
    { transactionId: paymentId },
    { enabled: Boolean(paymentId), refetchInterval: 7000 },
  );

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    const showReminder = () => {
      if (remindersDismissed.current) return;
      setReminderIndex((index) => (index + 1) % reminderMessages.length);
      setReminderVisible(true);
      hideTimer = window.setTimeout(() => setReminderVisible(false), 5000);
    };
    const firstReminder = window.setTimeout(showReminder, 5000);
    const reminderLoop = window.setInterval(showReminder, 24000);
    return () => {
      window.clearTimeout(firstReminder);
      if (hideTimer) window.clearTimeout(hideTimer);
      window.clearInterval(reminderLoop);
    };
  }, []);

  const dismissReminder = () => {
    remindersDismissed.current = true;
    setReminderVisible(false);
  };

  const shareCampaign = async () => {
    const shareData = { title: "Vaquinha Vida do Bem", text: "Quando uma criança precisa, cada gesto de cuidado importa.", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copiado. Obrigado por compartilhar!");
        window.setTimeout(() => setShareMessage(""), 4000);
      }
    } catch {
      setShareMessage("");
    }
  };

  const createPayment = () => {
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      setPaymentError("Escolha um valor de pelo menos R$ 1,00.");
      return;
    }

    setPaymentError("");
    setCopied(false);
    createPixMutation.mutate({ amountCents }, {
      onSuccess: (result) => {
        setPayment(result);
        setPaymentId(result.id);
      },
      onError: (error) => setPaymentError(error.message),
    });
  };

  const resetPayment = () => {
    setPayment(null);
    setPaymentId("");
    setPaymentError("");
    setCopied(false);
  };

  const copyPixCode = async () => {
    if (!payment?.copyPaste || !navigator.clipboard) return;
    await navigator.clipboard.writeText(payment.copyPaste);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  const chooseCategory = (category: typeof helpCategories[number]) => {
    setSelectedCategory(category);
    setAmount(25);
    resetPayment();
    window.setTimeout(() => document.getElementById("doar")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  return (
    <div className="simple-site">
      <a className="skip-link" href="#conteudo">Ir direto para o conteúdo</a>
      <header className="simple-header">
        <a className="simple-brand" href="#inicio" onClick={closeMenu} aria-label="Vida do Bem, início">
          <span className="brand-heart"><Heart size={21} fill="currentColor" /></span>
          <span>Vida do Bem</span>
        </a>
        <button className="simple-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <nav className={`simple-nav ${menuOpen ? "open" : ""}`} aria-label="Menu principal">
          <a href="#campanha" onClick={closeMenu}>A campanha</a>
          <a href="#categorias" onClick={closeMenu}>Formas de ajudar</a>
          <a href="#destino" onClick={closeMenu}>Como ajudar</a>
          <a href="#resultados" onClick={closeMenu}>Resultados</a>
          <a href="#contato" onClick={closeMenu}>Contato</a>
          <a className="simple-header-button" href="#doar" onClick={closeMenu}>Doar agora</a>
        </nav>
      </header>

      <main id="conteudo">
        <section className="simple-hero" id="inicio">
          <div className="simple-hero-photo" role="img" aria-label="Profissional de saúde cuidando de uma criança em um hospital" />
          <div className="simple-hero-shade" />
          <div className="simple-container simple-hero-content">
            <p className="simple-kicker">Vaquinha Vida do Bem</p>
            <h1>Quando uma criança precisa, cada gesto de cuidado importa.</h1>
            <p className="simple-hero-text">Uma contribuição pode levar alívio a uma família que está atravessando um momento difícil. Doe com o valor que estiver ao seu alcance e acompanhe com clareza a finalidade escolhida.</p>
            <div className="simple-actions">
              <a className="simple-button simple-button-primary" href="#doar">Quero doar <ArrowRight size={21} /></a>
              <a className="simple-button simple-button-white" href="#campanha">Entender a campanha</a>
              <button className="simple-button simple-button-white" onClick={shareCampaign}>Compartilhar <Share2 size={20} /></button>
            </div>
            {shareMessage && <p className="share-feedback" role="status">{shareMessage}</p>}
          </div>
        </section>

        <section className="simple-intro simple-container" id="campanha">
          <div>
            <p className="simple-kicker simple-kicker-dark">Quando uma família precisa de apoio</p>
            <h2>Nenhuma família deveria enfrentar um momento difícil sozinha.</h2>
          </div>
          <div className="simple-readable-text">
            <p>Quando uma criança adoece, a rotina inteira muda. Surgem consultas, deslocamentos, remédios e escolhas difíceis — justamente quando a família mais precisa de apoio.</p>
            <p>Sua contribuição transforma solidariedade em apoio concreto. Escolha uma finalidade, veja as informações da campanha e ajude de acordo com as suas possibilidades.</p>
          </div>
        </section>

        <section className="simple-video-section">
          <div className="simple-container"><div className="simple-video-copy"><p className="simple-kicker simple-kicker-dark">O cuidado começa com um gesto</p><h2>Às vezes, o que parece pequeno para uma pessoa representa acolhimento para outra.</h2><p className="simple-readable-text">Veja uma montagem curta de imagens reais de cuidado pediátrico. Doe com consciência e escolha o valor que cabe no seu momento.</p></div><div className="simple-video-frame"><video src="/videos/vida-do-bem-mobile.mp4" poster="/images/child-care-hero-portrait.jpg" autoPlay muted loop playsInline controls aria-label="Vídeo de uma montagem respeitosa de cuidado pediátrico" /></div></div>
        </section>

        <section className="simple-destino" id="destino">
          <div className="simple-container">
            <div className="simple-section-heading">
              <p className="simple-kicker simple-kicker-dark">Como o dinheiro será usado</p>
              <h2>Solidariedade que se transforma em cuidado.</h2>
            </div>
            <div className="simple-help-grid">
              <article className="simple-help-card"><span className="simple-help-number">1</span><h3>Tratamento</h3><p>Ajuda para consultas, exames e remédios que não podem esperar.</p></article>
              <article className="simple-help-card"><span className="simple-help-number">2</span><h3>Alimentação</h3><p>Comida e itens básicos para a criança e sua família durante o tratamento.</p></article>
              <article className="simple-help-card"><span className="simple-help-number">3</span><h3>Transporte</h3><p>Passagens para chegar ao hospital e voltar para casa com segurança.</p></article>
            </div>
            <div className="simple-photo-row"><img src="/images/child-care-checkup.jpg" alt="Profissional de saúde examinando uma criança" /><img src="/images/child-care-friends.jpg" alt="Duas crianças recebendo cuidado no hospital" /></div>
          </div>
        </section>

        <section className="category-section" id="categorias">
          <div className="simple-container">
            <p className="simple-kicker simple-kicker-dark">Escolha sua forma de ajudar</p>
            <h2>Que tipo de ajuda você quer oferecer hoje?</h2>
            <p className="category-lead">Existem muitas formas de transformar solidariedade em ação. Escolha uma categoria, descubra como sua contribuição pode ajudar e faça parte dessa mudança.</p>
            <div className="category-grid">
              {helpCategories.map((category) => { const Icon = category.icon; return <article className="category-card" key={category.id}><div className="category-icon"><Icon size={28} /></div><h3>{category.title}</h3><p>{category.phrase}</p><button className="category-button" onClick={() => chooseCategory(category)}>{category.button}<ArrowRight size={18} /></button></article>; })}
            </div>
            <p className="category-closing">Não importa o tamanho da sua contribuição. Escolha uma forma de ajudar e dê o primeiro passo.</p>
          </div>
        </section>

        <section className="simple-results" id="resultados">
          <div className="simple-container">
            <div className="simple-results-heading"><div><p className="simple-kicker simple-kicker-dark">A campanha em números</p><h2>Quando cada pessoa ajuda como pode, ninguém precisa carregar tudo sozinho.</h2></div><p className="simple-readable-text">Cada doação é registrada e usada para atender crianças e famílias que precisam de apoio durante o tratamento.</p></div>
            <div className="simple-stats-grid"><div className="simple-stat"><Users size={30} /><strong>Meta</strong><span>Apoiar crianças e suas famílias durante o tratamento.</span></div><div className="simple-stat"><Heart size={30} /><strong>R$ 25 mil</strong><span>Meta total da campanha.</span></div><div className="simple-stat"><MapPin size={30} /><strong>Transparência</strong><span>Atualizações serão publicadas no site.</span></div></div>
          </div>
        </section>

        <section className="simple-donation-section" id="doar">
          <div className="simple-container simple-donation-layout">
            <div className="simple-donation-copy">
              <p className="simple-kicker">Transforme intenção em cuidado</p>
              <h2>Seu gesto tem valor.</h2>
              <p>Finalidade escolhida: <strong>{selectedCategory.title}</strong>. Escolha um valor para gerar uma cobrança Pix real. O pagamento será confirmado somente depois que a PromissePay informar o status aprovado.</p>
              <div className="selected-purpose"><strong>{selectedCategory.title}</strong><span>{selectedCategory.instructions}</span>{selectedCategory.physical && <small>Para doar itens físicos, entre em contato antes da entrega.</small>}</div>
              <div className="simple-progress" aria-label="Meta da arrecadação: 25 mil reais"><div className="simple-progress-top"><strong>Meta da campanha: R$ 25.000</strong><span>Atualização em breve</span></div><div className="simple-progress-track"><span className="progress-empty" /></div></div>
            </div>
            <div className="simple-donation-box">
              {payment ? <div className="simple-pix-result"><CheckCircle2 size={44} /><h3>Pix gerado</h3><p>Finalidade: <strong>{selectedCategory.title}</strong><br />Valor: <strong>R$ {(payment.amountCents / 100).toFixed(2).replace(".", ",")}</strong>. Abra o aplicativo do seu banco para pagar.</p>{payment.qrCodeBase64 && <img className="pix-qr-code" src={payment.qrCodeBase64} alt="QR Code Pix para realizar a doação" />}<div className="pix-status"><strong>Status:</strong> {paymentStatusQuery.data?.status === "paid" ? "Pagamento confirmado" : "Aguardando pagamento"}</div>{payment.copyPaste && <div className="pix-copy-box"><span>Código Pix copia e cola</span><code>{payment.copyPaste}</code><button className="simple-button simple-button-primary" onClick={copyPixCode}>{copied ? "Código copiado" : "Copiar código Pix"}</button></div>}{payment.paymentLink && <a className="simple-text-button" href={payment.paymentLink} target="_blank" rel="noreferrer">Abrir página de pagamento</a>}<button className="simple-text-button" onClick={resetPayment}>Escolher outro valor</button></div> : <><h3>Doação para: {selectedCategory.title}</h3><div className="simple-amount-grid">{donationOptions.map((option) => <button key={option} className={amount === option ? "selected" : ""} onClick={() => setAmount(option)}>R$ {option}</button>)}</div><label className="simple-other-amount">Outro valor<input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>{paymentError && <p className="payment-error" role="alert">{paymentError}</p>}<button className="simple-button simple-button-primary simple-full-button" onClick={createPayment} disabled={createPixMutation.isPending}>{createPixMutation.isPending ? "Gerando Pix..." : <>Continuar <ArrowRight size={21} /></>}</button><p className="simple-small-note"><ShieldCheck size={16} /> Cobrança protegida pelo provedor PromissePay</p></>}
            </div>
          </div>
        </section>

        <section className="simple-contact simple-container" id="contato">
          <div><p className="simple-kicker simple-kicker-dark">Fale com a gente</p><h2>Quer fazer parte dessa ajuda?</h2><p className="simple-readable-text">Fale com a gente. Transparência também é uma forma de cuidar de quem escolhe ajudar.</p></div>
          <div className="simple-contact-links"><a href="tel:+556130389280"><Phone size={25} /> <span><strong>Telefone</strong>+55 (61) 3038-9280</span></a><a href="mailto:institudoajudajovens@gmail.com"><Mail size={25} /> <span><strong>E-mail</strong>institudoajudajovens@gmail.com</span></a></div>
        </section>

        <section className="simple-faq" id="duvidas">
          <div className="simple-container"><p className="simple-kicker simple-kicker-dark">Perguntas frequentes</p><h2>Quer saber mais?</h2><div className="simple-faq-list"><details><summary>Quem vai receber a ajuda? <ChevronDown size={24} /></summary><p>Crianças em tratamento e suas famílias, acompanhadas por instituições e profissionais parceiros.</p></details><details><summary>Como posso acompanhar o uso do dinheiro? <ChevronDown size={24} /></summary><p>Vamos divulgar atualizações da campanha e os principais destinos das doações neste site.</p></details><details><summary>Posso doar outro valor? <ChevronDown size={24} /></summary><p>Sim. No quadro de doação, você pode escrever o valor que conseguir contribuir.</p></details></div></div>
        </section>
      </main>

      <footer className="simple-footer"><div className="simple-container"><div><a className="simple-brand footer-brand" href="#inicio"><span className="brand-heart"><Heart size={21} fill="currentColor" /></span><span>Vida do Bem</span></a><p>Uma campanha para cuidar de crianças.</p></div><a className="simple-footer-top" href="#inicio">Voltar ao início <ArrowRight size={18} /></a></div></footer>
      {reminderVisible && <aside className="donation-reminder" role="status" aria-live="polite"><button className="reminder-close" onClick={dismissReminder} aria-label="Fechar lembrete">×</button><span className="reminder-icon"><Bell size={21} fill="currentColor" /></span><div><strong>Uma ajuda sua pode mudar este dia</strong><p>{reminderMessages[reminderIndex]}</p><a href="#doar" onClick={() => setReminderVisible(false)}>Quero ajudar agora <ArrowRight size={17} /></a></div></aside>}
    </div>
  );
}
