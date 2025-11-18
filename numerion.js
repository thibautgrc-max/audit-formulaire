(function(){
  const form = document.getElementById('auditWizardForm');
  const successCard = document.getElementById('auditSuccessLocal');
  const formCard = document.getElementById('form-audit');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.wizard-step'));
  const progressFill = document.getElementById('wizardProgressFill');
  const labels = Array.from(document.querySelectorAll('.wizard-step-label'));
  const prevBtn = document.getElementById('wizardPrev');
  const nextBtn = document.getElementById('wizardNext');
  const submitBtn = document.getElementById('wizardSubmit');
  const indicator = document.getElementById('wizardStepIndicator');
  const statusNode = document.getElementById('wizardStatus');
  const summaryNode = document.getElementById('wizardSummary');

  const submitDateInput = document.getElementById('wizardSubmitDate');
  const sourceInput = document.getElementById('wizardSource');
  const maturityInput = document.getElementById('wizardMaturityScore');
  const segmentInput = document.getElementById('wizardSegment');

  let current = 0; // index

  // Masquer le bouton "Envoyer" par défaut (affiché seulement à l'étape 5)
  submitBtn.style.display = 'none';

  // Source depuis l’URL (?source=...) ou valeur par défaut
  (function initSource(){
    try {
      const params = new URLSearchParams(window.location.search);
      const src = params.get('source') || 'Site Numérion Éducation';
      if (sourceInput) sourceInput.value = src;
    } catch(e) {
      if (sourceInput) sourceInput.value = 'Site Numérion Éducation';
    }
  })();

  function updateUI(){
    steps.forEach((step,i)=>{
      step.classList.toggle('is-active', i === current);
    });
    labels.forEach((lbl,i)=>{
      lbl.classList.toggle('is-active', i === current);
    });

    const total = steps.length;
    const percent = ((current + 1) / total) * 100;
    if (progressFill) progressFill.style.width = percent + '%';
    if (indicator) indicator.textContent = `Étape ${current+1} sur ${total}`;
    prevBtn.disabled = current === 0;

    if (current === total - 1) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'inline-flex';
      buildSummary();
    } else {
      nextBtn.style.display = 'inline-flex';
      submitBtn.style.display = 'none';
      if (summaryNode) summaryNode.innerHTML = '';
    }

    statusNode.textContent = '';

    // Focus sur l’étape active + scroll
    const activeStep = steps[current];
    if (activeStep) {
      activeStep.setAttribute('tabindex','-1');
      activeStep.focus({preventScroll:true});
      const rect = form.getBoundingClientRect();
      const offset = window.pageYOffset + rect.top - 80;
      window.scrollTo({top: offset, behavior:'smooth'});
    }
  }

  function validateStep(index){
    const step = steps[index];
    if (!step) return true;
    const requiredFields = Array.from(step.querySelectorAll('[required]'));
    let valid = true;

    for (const field of requiredFields) {
      field.setCustomValidity('');

      const isCheckbox = field.type === 'checkbox';
      const isEmpty = isCheckbox ? !field.checked : !field.value.trim();

      if (isEmpty) {
        field.setCustomValidity('Champ requis');
      }

      if (!field.reportValidity()) {
        valid = false;
        break;
      }
    }

    if (!valid) {
      statusNode.textContent = "Certains champs sont manquants ou invalides à cette étape. Merci de les compléter.";
    } else {
      statusNode.textContent = '';
    }
    return valid;
  }

  function buildSummary(){
    if (!summaryNode) return;

    const nomSoc = document.getElementById('nomSoc')?.value || '';
    const role = document.getElementById('role')?.value || '';
    const secteur = document.getElementById('secteur')?.value || '';
    const taille = document.getElementById('taille')?.value || '';
    const tresoEst = document.getElementById('tresoEst')?.value || '';
    const alloc = document.getElementById('alloc')?.value || '';
    const horizon = document.getElementById('horizon')?.value || '';
    const urgence = document.getElementById('urgence')?.value || '';
    const objectif = document.getElementById('objectifPrioritaire')?.value || '';

    const items = [
      nomSoc ? `Entreprise : ${nomSoc}` : '',
      role ? `Rôle décisionnel : ${role}` : '',
      (secteur || taille) ? `Profil : ${secteur || 'Secteur non précisé'} · ${taille || 'Taille non précisée'}` : '',
      tresoEst ? `Trésorerie disponible estimée : ${tresoEst}` : '',
      alloc ? `Allocation crypto envisagée : ${alloc}` : '',
      horizon ? `Horizon de la poche : ${horizon}` : '',
      urgence ? `Niveau d’urgence : ${urgence}` : '',
      objectif ? `Objectif prioritaire : ${objectif}` : ''
    ].filter(Boolean);

    if (!items.length) {
      summaryNode.innerHTML = '';
      return;
    }

    summaryNode.innerHTML = `
      <div class="wizard-summary-title">Résumé des points clés transmis</div>
      <ul class="wizard-summary-list">
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
      <p style="margin-top:.4rem">
        Ce résumé sera intégré à votre dossier afin de faciliter la lecture pour votre direction et vos auditeurs.
      </p>
    `;
  }

  function computeMaturityScore(){
    const maturity = document.getElementById('maturity')?.value || '';
    const exposition = document.getElementById('expositionActuelle')?.value || '';
    const urgence = document.getElementById('urgence')?.value || '';

    let score = 0;

    if (maturity === 'Aucune') score += 20;
    if (maturity === 'Partielle') score += 50;
    if (maturity === 'Complète') score += 80;

    if (exposition === 'Aucune exposition') score += 20;
    if (exposition === 'Exposition limitée & non structurée') score += 40;
    if (exposition === 'Exposition significative déjà en place') score += 60;

    if (urgence === 'Étude / cadrage interne') score += 10;
    if (urgence === 'Instruction board / comité déjà lancée') score += 25;
    if (urgence === 'Exécution dans les 30 jours') score += 40;

    score = Math.max(0, Math.min(100, score));
    if (maturityInput) maturityInput.value = String(score);
  }

  function computeSegment(){
    const secteur = document.getElementById('secteur')?.value || '';
    const taille = document.getElementById('taille')?.value || '';
    let segment = '';

    if (!secteur && !taille) {
      segment = '';
    } else {
      segment = `${secteur || 'Secteur ND'} — ${taille || 'Taille ND'}`;
    }

    if (segmentInput) segmentInput.value = segment;
  }

  // Navigation
  prevBtn.addEventListener('click', function(){
    if (current > 0) {
      current--;
      updateUI();
    }
  });

  nextBtn.addEventListener('click', function(){
    if (!validateStep(current)) return;
    if (current < steps.length - 1) {
      current++;
      updateUI();
    }
  });

  // Submit AJAX vers Formspree
  form.addEventListener('submit', function(e){
    e.preventDefault();

    if (!validateStep(current)) {
      return;
    }

    if (submitDateInput) {
      submitDateInput.value = new Date().toISOString();
    }

    computeMaturityScore();
    computeSegment();
    buildSummary();

    statusNode.textContent = "Envoi sécurisé de votre demande d’audit…";

    const formData = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
    .then(function(response){
      if (response.ok) {
        statusNode.textContent = "Votre demande d’audit Numérion a bien été envoyée.";
        // Affiche la carte de succès, masque le formulaire
        if (successCard) {
          successCard.style.display = 'block';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (formCard) {
          formCard.style.display = 'none';
        }
        // Sécurise les boutons
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        submitBtn.disabled = true;
      } else {
        return response.json().then(function(data){
          throw new Error(data.error || 'Une erreur est survenue lors de l’envoi.');
        });
      }
    })
    .catch(function(error){
      statusNode.textContent = "Erreur lors de l’envoi de votre demande d’audit. Merci de réessayer ou de nous contacter directement.";
      console.error(error);
    });
  });

  // Init UI
  updateUI();
})();
