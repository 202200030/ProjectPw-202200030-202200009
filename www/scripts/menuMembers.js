"use strict";
//202200030 202200030@estudantes.ips.pt
//202200009 202200009@estudantes.ips.pt

/**
 * Classe que representa um Membro.
 */
let Member = function Member(name = "", preferredEventTypes = []) {
  this.id = 0;
  this.name = name;
  this.preferredEventTypes = preferredEventTypes;
  this.registeredEvents = [];
};

Member.propertyLabels = {
  id: "Id",
  name: "Nome",
  preferredEventTypes: "Tipos de Eventos Preferidos",
  registeredEvents: "Eventos Inscritos"
};

function MenuMember() {
  this.members = [];
  this.selectedMember = null;
}


MenuMember.prototype.toTable = function () {
  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let headerRow = document.createElement("tr");
  for (let prop in Member.propertyLabels) {
    let th = document.createElement("th");
    th.textContent = Member.propertyLabels[prop];
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  this.members.forEach((member) => {
    let row = document.createElement("tr");
    row.addEventListener("click", () => {
      tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
      row.classList.add("selected");
      this.selectedMember = member;
    });
    for (let prop in Member.propertyLabels) {
      let cell = document.createElement("td");
      if (prop === "preferredEventTypes") {
        let descArray = member.preferredEventTypes.map((id) => {
          let found = MenuEventType.default.eventTypes.find((t) => t.id === id);
          return found ? found.description : id;
        });
        cell.textContent = descArray.join(", ");
      } else if (prop === "registeredEvents") {
        let eventsDesc = member.registeredEvents.map((evt) => evt.description).join(", ");
        cell.textContent = eventsDesc;
      } else {
        cell.textContent = member[prop];
      }
      row.appendChild(cell);
    }
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
};


MenuMember.prototype.loadFromServer = async function () {
  try {
    let response = await fetch("http://localhost:3000/members");
    if (!response.ok) throw new Error("Erro ao carregar membros");
    let data = await response.json();
    this.members = data.map((obj) => {
      let m = new Member(obj.name);
      m.id = obj.id;
      m.preferredEventTypes = obj.preferredEventTypeIds || [];
      m.registeredEvents = obj.eventIds
        ? obj.eventIds.map(eid => {
            let found = MenuEvent.default.events.find(e => e.id === eid);
            return found ? found : { id: eid, description: "(evento desconhecido)" };
          })
        : [];
      return m;
    });
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar membros");
    this.members = [];
  }
};


MenuMember.prototype.createForm = function (member = null) {
  let formContainer = document.createElement("form");
  let title = document.createElement("h3");
  title.textContent = member ? "Editar Membro" : "Criar Membro";
  formContainer.appendChild(title);

  let nameLabel = document.createElement("label");
  nameLabel.textContent = "Nome";
  nameLabel.style.display = "block";
  let nameInput = document.createElement("input");
  nameInput.type = "text";
  if (member) nameInput.value = member.name;
  formContainer.appendChild(nameLabel);
  formContainer.appendChild(nameInput);

  let prefLabel = document.createElement("label");
  prefLabel.textContent = "Tipos de Eventos Preferidos";
  prefLabel.style.display = "block";
  formContainer.appendChild(prefLabel);

  let prefContainer = document.createElement("div");
  prefContainer.style.display = "grid";
  prefContainer.style.gridTemplateColumns = "1fr 1fr";
  prefContainer.style.gap = "0.5rem";

  MenuEventType.default.eventTypes.forEach(et => {
    let chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = et.id;
    chk.id = `pref_et_${et.id}`;
    if (member && member.preferredEventTypes.includes(et.id)) {
      chk.checked = true;
    }
    let lbl = document.createElement("label");
    lbl.htmlFor = `pref_et_${et.id}`;
    lbl.textContent = et.description;
    let group = document.createElement("div");
    group.appendChild(chk);
    group.appendChild(lbl);
    prefContainer.appendChild(group);
  });
  formContainer.appendChild(prefContainer);

  let btnContainer = document.createElement("div");
  let saveBtn = document.createElement("button");
  saveBtn.textContent = "Gravar";
  saveBtn.type = "button";
  saveBtn.addEventListener("click", async () => {
    let name = nameInput.value.trim();
    let checkedIds = Array.from(prefContainer.querySelectorAll("input[type='checkbox']:checked"))
      .map(chk => Number(chk.value));
    if (!name) {
      alert("Nome obrigatório");
      return;
    }
    if (member) {
      try {
        let resp = await fetch(`http://localhost:3000/members/${member.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, preferredEventTypeIds: checkedIds })
        });
        if (!resp.ok) throw new Error("Erro ao atualizar membro");
        member.name = name;
        member.preferredEventTypes = checkedIds;
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar membro");
      }
    } else {
      try {
        let resp = await fetch("http://localhost:3000/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, preferredEventTypeIds: checkedIds })
        });
        if (!resp.ok) throw new Error("Erro ao criar membro");
        let created = await resp.json();
        let newMember = new Member(created.name);
        newMember.id = created.id;
        newMember.preferredEventTypes = checkedIds;
        newMember.registeredEvents = [];
        this.members.push(newMember);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao criar membro");
      }
    }
  });

  let cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancelar";
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", () => {
    this.show();
  });
  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);
  formContainer.appendChild(btnContainer);

  if (member) {
    let actions = document.createElement("div");
    let regBtn = document.createElement("button");
    regBtn.textContent = "Inscrever em Evento";
    regBtn.type = "button";
    regBtn.addEventListener("click", () => {
      this.showEventRegistrationForm(member);
    });
    let unregBtn = document.createElement("button");
    unregBtn.textContent = "Desinscrever de Evento";
    unregBtn.type = "button";
    unregBtn.addEventListener("click", () => {
      this.showEventUnregistrationForm(member);
    });
    actions.appendChild(regBtn);
    actions.appendChild(unregBtn);
    formContainer.appendChild(actions);
  }

  return formContainer;
};

MenuMember.prototype.showForm = function (member = null) {
  let container = document.getElementById("members");
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(this.createForm(member));
};

MenuMember.prototype.show = async function () {
  let container = document.getElementById("members");
  while (container.firstChild) container.removeChild(container.firstChild);

  await MenuEventType.default.loadFromServer();
  await MenuEvent.default.loadFromServer();
  await this.loadFromServer();

  container.appendChild(this.toTable());

  let btnContainer = document.createElement("div");
  let createBtn = document.createElement("button");
  createBtn.textContent = "Criar";
  createBtn.addEventListener("click", () => {
    this.showForm();
  });
  let editBtn = document.createElement("button");
  editBtn.textContent = "Editar";
  editBtn.addEventListener("click", () => {
    if (this.selectedMember) {
      this.showForm(this.selectedMember);
    } else {
      alert("Selecione um membro!");
    }
  });
  let deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Apagar";
  deleteBtn.addEventListener("click", async () => {
    if (!this.selectedMember) {
      alert("Selecione um membro!");
      return;
    }
    try {
      let resp = await fetch(`http://localhost:3000/members/${this.selectedMember.id}`, {
        method: "DELETE"
      });
      if (!resp.ok) {
        let errData = await resp.json();
        alert(errData.message || "Erro ao apagar membro");
        return;
      }
      this.members = this.members.filter(m => m.id !== this.selectedMember.id);
      this.selectedMember = null;
      this.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar membro");
    }
  });

  btnContainer.appendChild(createBtn);
  btnContainer.appendChild(editBtn);
  btnContainer.appendChild(deleteBtn);
  container.appendChild(btnContainer);
};

MenuMember.prototype.loadFromServer = async function () {
  try {
    let response = await fetch("http://localhost:3000/members");
    if (!response.ok) throw new Error("Erro ao carregar membros");
    let data = await response.json();
    this.members = data.map(obj => {
      let m = new Member(obj.name);
      m.id = obj.id;
      m.preferredEventTypes = obj.preferredEventTypeIds || [];
      m.registeredEvents = obj.eventIds
        ? obj.eventIds.map(eid => {
            let found = MenuEvent.default.events.find(e => e.id === eid);
            return found ? found : { id: eid, description: "(evento desconhecido)" };
          })
        : [];
      return m;
    });
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar membros");
    this.members = [];
  }
};

MenuMember.prototype.showEventRegistrationForm = function (member) {
  let container = document.getElementById("members");
  while (container.firstChild) container.removeChild(container.firstChild);

  let formContainer = document.createElement("div");
  let title = document.createElement("h3");
  title.textContent = "Inscrição em Evento";
  formContainer.appendChild(title);

  let select = document.createElement("select");
  let available = MenuEvent.default.events.filter(evt =>
    member.preferredEventTypes.includes(evt.id) &&
    !member.registeredEvents.some(e => e.id === evt.id) &&
    new Date(evt.date) > new Date()
  );
  available.forEach(evt => {
    let opt = document.createElement("option");
    opt.value = evt.id;
    opt.textContent = `${evt.type} - ${evt.description} (${evt.date})`;
    select.appendChild(opt);
  });
  if (!select.childElementCount) {
    let msg = document.createElement("p");
    msg.textContent = "Não há eventos disponíveis para inscrição.";
    formContainer.appendChild(msg);
    let backBtn = document.createElement("button");
    backBtn.textContent = "Voltar";
    backBtn.addEventListener("click", () => {
      this.show();
    });
    formContainer.appendChild(backBtn);
    container.appendChild(formContainer);
    return;
  }
  formContainer.appendChild(select);

  let btnContainer = document.createElement("div");
  let acceptBtn = document.createElement("button");
  acceptBtn.textContent = "Aceitar";
  acceptBtn.addEventListener("click", async () => {
    let evtId = select.value;
    if (evtId) {
      try {
        let resp = await fetch(`http://localhost:3000/members/${member.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: evtId })
        });
        if (!resp.ok) throw new Error("Erro ao inscrever em evento");
        let found = MenuEvent.default.events.find(e => e.id == evtId);
        if (found) member.registeredEvents.push(found);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao inscrever em evento");
      }
    }
  });
  let cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", () => {
    this.show();
  });
  btnContainer.appendChild(acceptBtn);
  btnContainer.appendChild(cancelBtn);
  formContainer.appendChild(btnContainer);
  container.appendChild(formContainer);
};

MenuMember.prototype.showEventUnregistrationForm = function (member) {
  let container = document.getElementById("members");
  while (container.firstChild) container.removeChild(container.firstChild);

  let formContainer = document.createElement("div");
  let title = document.createElement("h3");
  title.textContent = "Desinscrição de Evento";
  formContainer.appendChild(title);

  let select = document.createElement("select");
  member.registeredEvents.forEach(evt => {
    let opt = document.createElement("option");
    opt.value = evt.id;
    opt.textContent = `${evt.type} - ${evt.description} (${evt.date})`;
    select.appendChild(opt);
  });
  if (!select.childElementCount) {
    let msg = document.createElement("p");
    msg.textContent = "Não há eventos para desinscrição.";
    formContainer.appendChild(msg);
    let backBtn = document.createElement("button");
    backBtn.textContent = "Voltar";
    backBtn.addEventListener("click", () => {
      this.show();
    });
    formContainer.appendChild(backBtn);
    container.appendChild(formContainer);
    return;
  }
  formContainer.appendChild(select);

  let btnContainer = document.createElement("div");
  let acceptBtn = document.createElement("button");
  acceptBtn.textContent = "Aceitar";
  acceptBtn.addEventListener("click", async () => {
    let evtId = select.value;
    if (evtId) {
      try {
        let resp = await fetch(`http://localhost:3000/members/${member.id}/events/${evtId}`, {
          method: "DELETE"
        });
        if (!resp.ok) throw new Error("Erro ao desinscrever de evento");
        member.registeredEvents = member.registeredEvents.filter(e => e.id != evtId);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao desinscrever de evento");
      }
    }
  });
  let cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", () => {
    this.show();
  });
  btnContainer.appendChild(acceptBtn);
  btnContainer.appendChild(cancelBtn);
  formContainer.appendChild(btnContainer);
  container.appendChild(formContainer);
};

MenuMember.default = new MenuMember();
