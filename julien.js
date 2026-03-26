let tournois = [];
let dossierHandle = null;

const statusEl = document.getElementById("status");
const tableEl = document.getElementById("table");
const emptyMessageEl = document.getElementById("emptyMessage");
const tableInfoEl = document.getElementById("tableInfo");

const nbTournoisEl = document.getElementById("nbTournois");
const coutTotalEl = document.getElementById("coutTotal");
const gainsTotauxEl = document.getElementById("gainsTotaux");
const beneficeNetEl = document.getElementById("beneficeNet");
const roiEl = document.getElementById("roi");

document.getElementById("choisirDossierBtn").addEventListener("click", choisirDossier);
document.getElementById("chargerRecentBtn").addEventListener("click", chargerFichierLePlusRecent);
document.getElementById("sauvegarderBtn").addEventListener("click", sauvegarderDansDossier);
document.getElementById("ajouterBtn").addEventListener("click", ajouterTournoi);
document.getElementById("toutSupprimerBtn").addEventListener("click", toutSupprimer);

afficherTournois();
calculerStats();

function setStatus(message) {
  statusEl.textContent = message;
}

function formatEuro(value) {
  return `${value.toFixed(2)} €`;
}

function nomFichierExport() {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  const heure = String(maintenant.getHours()).padStart(2, "0");
  const minute = String(maintenant.getMinutes()).padStart(2, "0");
  const seconde = String(maintenant.getSeconds()).padStart(2, "0");

  return `tournois_${annee}-${mois}-${jour}_${heure}-${minute}-${seconde}.json`;
}

function extraireCleTri(nomFichier) {
  const regex = /^tournois_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/;
  const match = nomFichier.match(regex);

  if (!match) {
    return null;
  }

  const date = match[1];
  const heure = match[2].replace(/-/g, ":");

  return `${date}T${heure}`;
}

async function choisirDossier() {
  if (!window.showDirectoryPicker) {
    alert("Cette fonctionnalité n'est pas supportée par ce navigateur.");
    return;
  }

  try {
    dossierHandle = await window.showDirectoryPicker({
      mode: "readwrite",
      id: "tournois-folder"
    });

    setStatus("Dossier sélectionné avec succès.");
  } catch (error) {
    console.error(error);
    setStatus("Sélection du dossier annulée.");
  }
}

async function verifierPermission(handle) {
  const options = { mode: "readwrite" };

  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }

  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
}

async function chargerFichierLePlusRecent() {
  if (!dossierHandle) {
    alert("Choisis d'abord un dossier.");
    return;
  }

  try {
    const permission = await verifierPermission(dossierHandle);

    if (!permission) {
      alert("Permission refusée pour lire le dossier.");
      return;
    }

    const fichiersValides = [];

    for await (const [nom, handle] of dossierHandle.entries()) {
      if (handle.kind === "file") {
        const cleTri = extraireCleTri(nom);

        if (cleTri) {
          fichiersValides.push({ nom, handle, cleTri });
        }
      }
    }

    if (fichiersValides.length === 0) {
      alert("Aucun fichier JSON valide trouvé dans le dossier.");
      return;
    }

    fichiersValides.sort((a, b) => b.cleTri.localeCompare(a.cleTri));

    const plusRecent = fichiersValides[0];
    const file = await plusRecent.handle.getFile();
    const texte = await file.text();
    const donnees = JSON.parse(texte);

    if (!Array.isArray(donnees)) {
      alert("Le contenu du fichier est invalide.");
      return;
    }

    tournois = donnees;
    afficherTournois();
    calculerStats();
    setStatus(`Fichier chargé : ${plusRecent.nom}`);
  } catch (error) {
    console.error(error);
    alert("Erreur pendant le chargement du fichier le plus récent.");
  }
}

async function sauvegarderDansDossier() {
  if (!dossierHandle) {
    alert("Choisis d'abord un dossier.");
    return;
  }

  try {
    const permission = await verifierPermission(dossierHandle);

    if (!permission) {
      alert("Permission refusée pour écrire dans le dossier.");
      return;
    }

    const nom = nomFichierExport();
    const fileHandle = await dossierHandle.getFileHandle(nom, { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(JSON.stringify(tournois, null, 2));
    await writable.close();

    setStatus(`Sauvegarde créée : ${nom}`);
  } catch (error) {
    console.error(error);
    alert("Erreur pendant la sauvegarde.");
  }
}

function ajouterTournoi() {
  const date = document.getElementById("date").value;
  const buyin = parseFloat(document.getElementById("buyin").value);
  const resultat = parseFloat(document.getElementById("resultat").value);

  if (!date || Number.isNaN(buyin) || Number.isNaN(resultat)) {
    alert("Merci de remplir correctement tous les champs.");
    return;
  }

  if (buyin < 0 || resultat < 0) {
    alert("Les montants doivent être positifs.");
    return;
  }

  tournois.push({ date, buyin, resultat });
  afficherTournois();
  calculerStats();

  document.getElementById("date").value = "";
  document.getElementById("buyin").value = "";
  document.getElementById("resultat").value = "";
}

function supprimerTournoi(index) {
  tournois.splice(index, 1);
  afficherTournois();
  calculerStats();
}

function toutSupprimer() {
  if (!confirm("Voulez-vous vraiment supprimer toutes les données ?")) {
    return;
  }

  tournois = [];
  afficherTournois();
  calculerStats();
  setStatus("Toutes les données ont été supprimées de l'interface.");
}

function afficherTournois() {
  tableEl.innerHTML = "";

  if (tournois.length === 0) {
    emptyMessageEl.style.display = "block";
    tableInfoEl.textContent = "Aucune donnée chargée";
    return;
  }

  emptyMessageEl.style.display = "none";
  tableInfoEl.textContent = `${tournois.length} tournoi(x) affiché(s)`;

  tournois.forEach((tournoi, index) => {
    const benefice = tournoi.resultat - tournoi.buyin;
    const classeBenefice = benefice >= 0 ? "positive" : "negative";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tournoi.date}</td>
      <td>${formatEuro(tournoi.buyin)}</td>
      <td>${formatEuro(tournoi.resultat)}</td>
      <td class="${classeBenefice}">${formatEuro(benefice)}</td>
      <td><button class="row-btn" data-index="${index}">Supprimer</button></td>
    `;
    tableEl.appendChild(row);
  });

  document.querySelectorAll(".row-btn").forEach((button) => {
    button.addEventListener("click", () => {
      supprimerTournoi(Number(button.dataset.index));
    });
  });
}

function calculerStats() {
  const nbTournois = tournois.length;
  const coutTotal = tournois.reduce((somme, t) => somme + t.buyin, 0);
  const gainsTotaux = tournois.reduce((somme, t) => somme + t.resultat, 0);
  const beneficeNet = gainsTotaux - coutTotal;
  const roi = coutTotal > 0 ? (beneficeNet / coutTotal) * 100 : 0;

  nbTournoisEl.textContent = nbTournois;
  coutTotalEl.textContent = formatEuro(coutTotal);
  gainsTotauxEl.textContent = formatEuro(gainsTotaux);
  beneficeNetEl.textContent = formatEuro(beneficeNet);
  roiEl.textContent = `${roi.toFixed(2)} %`;

  beneficeNetEl.classList.remove("positive", "negative");
  roiEl.classList.remove("positive", "negative");

  beneficeNetEl.classList.add(beneficeNet >= 0 ? "positive" : "negative");
  roiEl.classList.add(roi >= 0 ? "positive" : "negative");
}