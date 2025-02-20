"use strict";

/**
 * Classe que representa um Membro.
 * O ID será definido pelo servidor.
 */
let Member = function Member(name = "", preferredEventTypes = []) {
  this.id = 0;
  this.name = name;
  // Agora armazenamos os ids (números) dos tipos preferidos
  this.preferredEventTypes = preferredEventTypes;
  this.registeredEvents = []; // array de eventos
};

Member.propertyLabels = {
  id: "Id",
  name: "Nome",
  preferredEventTypes: "Tipos de Eventos Preferidos",
  registeredEvents: "Eventos Inscritos"
};

/**
 * Classe para gerenciar os Membros e sua interface.
 */
function MenuMember() {
  this.members = [];
  this.selectedMember = null;
}

/**
 * Cria a tabela HTML para os membros.
 */
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
  if (this.members.length > 0) {
    this.members.forEach((member) => {
      let row = document.createElement("tr");
      row.addEventListener("click", () => {
        tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        this.selectedMember = member;
      });
      for (let prop in Member.propertyLabels) {
        let cell = document.createElement("td");
        if (Array.isArray(member[prop])) {
          if (prop === "registeredEvents") {
            let eventsDesc = member.registeredEvents.map((evt) => evt.description).join(", ");
            cell.textContent = eventsDesc;
          } else {
            // Para preferências: mapeia os ids para as descrições usando os dados de MenuEventType
            let descArray = member.preferredEventTypes.map((id) => {
              let et = MenuEventType.default.eventTypes.find((t) => t.id === id);
              return et ? et.description : id;
            });
            cell.textContent = descArray.join(", ");
          }
        } else {
          cell.textContent = member[prop];
        }
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    });
  }
  table.appendChild(tbody);
  return table;
};

/**
 * Carrega os membros do servidor.
 */
MenuMember.prototype.loadFromServer = async function () {
  try {
    let response = await fetch("http://localhost:3000/members");
    if (!response.ok) throw new Error("Erro ao carregar membros");
    let data = await response.json();
    this.members = data.map((obj) => {
      let m = new Member(obj.name);
      m.id = obj.id;
      // Agora armazenamos os ids dos tipos preferidos
      m.preferredEventTypes = obj.preferredEventTypes
        ? obj.preferredEventTypes.map((et) => et.id)
        : [];
      m.registeredEvents = obj.registeredEvents || [];
      return m;
    });
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar membros");
    this.members = [];
  }
};

/**
 * Cria o formulário para criar/editar um membro.
 */
MenuMember.prototype.createForm = function (member = null) {
  let formContainer = document.createElement("form");
  let formTitle = document.createElement("h3");
  formTitle.textContent = member ? "Editar Membro" : "Criar Membro";
  formContainer.appendChild(formTitle);

  // Campo Nome
  let nameLabel = document.createElement("label");
  nameLabel.textContent = "Nome";
  nameLabel.style.display = "block";
  let nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "memberName";
  if (member) nameInput.value = member.name;
  formContainer.appendChild(nameLabel);
  formContainer.appendChild(nameInput);

  // Checkboxes para Tipos de Eventos Preferidos
  let eventTypesLabel = document.createElement("label");
  eventTypesLabel.textContent = "Tipos de Eventos Preferidos";
  eventTypesLabel.style.display = "block";
  formContainer.appendChild(eventTypesLabel);

  let eventTypesContainer = document.createElement("div");
  eventTypesContainer.style.display = "grid";
  eventTypesContainer.style.gridTemplateColumns = "1fr 1fr";
  eventTypesContainer.style.gap = "0.5rem";

  // Cria um checkbox para cada tipo de evento usando o id (número)
  MenuEventType.default.eventTypes.forEach((type) => {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = type.id; // é o ID (número)
    checkbox.id = `eventType_${type.id}`;
    if (member && member.preferredEventTypes.includes(type.id)) {
      checkbox.checked = true;
    }
    let lbl = document.createElement("label");
    lbl.htmlFor = `eventType_${type.id}`;
    lbl.textContent = type.description;
    let group = document.createElement("div");
    group.appendChild(checkbox);
    group.appendChild(lbl);
    eventTypesContainer.appendChild(group);
  });
  formContainer.appendChild(eventTypesContainer);

  // Botões Gravar/Cancelar
  let buttonContainer = document.createElement("div");
  let saveButton = document.createElement("button");
  saveButton.textContent = "Gravar";
  saveButton.type = "button";
  saveButton.addEventListener("click", async () => {
    let name = nameInput.value.trim();
    // Converter os valores dos checkboxes para números
    let preferredEventTypes = Array.from(
      eventTypesContainer.querySelectorAll("input[type='checkbox']:checked")
    ).map((chk) => Number(chk.value));
    if (!name) {
      alert("O membro precisa de ter nome!");
      return;
    }
    if (member) {
      // Atualiza (PUT)
      try {
        let response = await fetch(`http://localhost:3000/members/${member.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, preferredEventTypeIds: preferredEventTypes })
        });
        if (!response.ok) throw new Error("Erro ao atualizar membro");
        member.name = name;
        member.preferredEventTypes = preferredEventTypes;
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar membro");
      }
    } else {
      // Cria (POST)
      try {
        let response = await fetch("http://localhost:3000/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, preferredEventTypeIds: preferredEventTypes })
        });
        if (!response.ok) throw new Error("Erro ao criar membro");
        let created = await response.json();
        let newMember = new Member(created.name);
        newMember.id = created.id;
        newMember.preferredEventTypes = preferredEventTypes;
        newMember.registeredEvents = [];
        this.members.push(newMember);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao criar membro");
      }
    }
  });

  let cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancelar";
  cancelButton.type = "button";
  cancelButton.addEventListener("click", () => {
    this.show();
  });
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);
  formContainer.appendChild(buttonContainer);

  // Botões de Inscrição/Desinscrição (apenas na edição)
  if (member) {
    let eventActionsContainer = document.createElement("div");

    let registerButton = document.createElement("button");
    registerButton.textContent = "Inscrever em Evento";
    registerButton.type = "button";
    registerButton.addEventListener("click", () => {
      this.showEventRegistrationForm(member);
    });

    let unregisterButton = document.createElement("button");
    unregisterButton.textContent = "Desinscrever de Evento";
    unregisterButton.type = "button";
    unregisterButton.addEventListener("click", () => {
      this.showEventUnregistrationForm(member);
    });

    eventActionsContainer.appendChild(registerButton);
    eventActionsContainer.appendChild(unregisterButton);
    formContainer.appendChild(eventActionsContainer);
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
  await this.loadFromServer();
  container.appendChild(this.toTable());

  let buttonContainer = document.createElement("div");
  let createButton = document.createElement("button");
  createButton.textContent = "Criar";
  createButton.addEventListener("click", () => {
    this.showForm();
  });
  let editButton = document.createElement("button");
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => {
    if (this.selectedMember) {
      this.showForm(this.selectedMember);
    } else {
      alert("Selecione um membro!");
    }
  });
  let deleteButton = document.createElement("button");
  deleteButton.textContent = "Apagar";
  deleteButton.addEventListener("click", async () => {
    if (!this.selectedMember) {
      alert("Selecione um membro!");
      return;
    }
    try {
      let response = await fetch(`http://localhost:3000/members/${this.selectedMember.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        let errData = await response.json();
        alert(errData.message || "Erro ao apagar membro");
        return;
      }
      this.members = this.members.filter((m) => m.id !== this.selectedMember.id);
      this.selectedMember = null;
      this.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar membro");
    }
  });

  buttonContainer.appendChild(createButton);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);
  container.appendChild(buttonContainer);
};

/**
 * Formulário para inscrição em evento.
 */
MenuMember.prototype.showEventRegistrationForm = function (member) {
  let container = document.getElementById("members");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  let formContainer = document.createElement("div");
  let formTitle = document.createElement("h3");
  formTitle.textContent = "Inscrição em Evento";
  formContainer.appendChild(formTitle);

  let eventSelect = document.createElement("select");
  // Filtrar eventos disponíveis: futuros, do tipo preferido e que o membro ainda não esteja inscrito
  let availableEvents = MenuEvent.default.events.filter(
    (evt) =>
      member.preferredEventTypes.includes(evt.id) &&
      !member.registeredEvents.some((e) => e.id === evt.id) &&
      new Date(evt.date) > new Date()
  );
  availableEvents.forEach((evt) => {
    let option = document.createElement("option");
    option.value = evt.id;
    option.textContent = `${evt.type} - ${evt.description} (${evt.date})`;
    eventSelect.appendChild(option);
  });

  if (eventSelect.childElementCount === 0) {
    let message = document.createElement("p");
    message.textContent = "Não há eventos disponíveis para inscrição.";
    formContainer.appendChild(message);
    let backButton = document.createElement("button");
    backButton.textContent = "Voltar";
    backButton.addEventListener("click", () => {
      this.show();
    });
    formContainer.appendChild(backButton);
    container.appendChild(formContainer);
    return;
  }

  formContainer.appendChild(eventSelect);

  let buttonContainer = document.createElement("div");
  let acceptButton = document.createElement("button");
  acceptButton.textContent = "Aceitar";
  acceptButton.addEventListener("click", async () => {
    let selectedEventId = eventSelect.value;
    if (selectedEventId) {
      try {
        let response = await fetch(`http://localhost:3000/members/${member.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: selectedEventId })
        });
        if (!response.ok) throw new Error("Erro ao inscrever em evento");
        let found = MenuEvent.default.events.find((evt) => evt.id == selectedEventId);
        if (found) member.registeredEvents.push(found);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao inscrever em evento");
      }
    }
  });

  let cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancelar";
  cancelButton.addEventListener("click", () => {
    this.show();
  });

  buttonContainer.appendChild(acceptButton);
  buttonContainer.appendChild(cancelButton);
  formContainer.appendChild(buttonContainer);
  container.appendChild(formContainer);
};

/**
 * Formulário para desinscrição de evento.
 */
MenuMember.prototype.showEventUnregistrationForm = function (member) {
  let container = document.getElementById("members");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  let formContainer = document.createElement("div");
  let formTitle = document.createElement("h3");
  formTitle.textContent = "Desinscrição de Evento";
  formContainer.appendChild(formTitle);

  let eventSelect = document.createElement("select");
  member.registeredEvents.forEach((evt) => {
    let option = document.createElement("option");
    option.value = evt.id;
    option.textContent = `${evt.type} - ${evt.description} (${evt.date})`;
    eventSelect.appendChild(option);
  });

  if (eventSelect.childElementCount === 0) {
    let message = document.createElement("p");
    message.textContent = "Não há eventos para desinscrição.";
    formContainer.appendChild(message);
    let backButton = document.createElement("button");
    backButton.textContent = "Voltar";
    backButton.addEventListener("click", () => {
      this.show();
    });
    formContainer.appendChild(backButton);
    container.appendChild(formContainer);
    return;
  }

  formContainer.appendChild(eventSelect);

  let buttonContainer = document.createElement("div");
  let acceptButton = document.createElement("button");
  acceptButton.textContent = "Aceitar";
  acceptButton.addEventListener("click", async () => {
    let selectedEventId = eventSelect.value;
    if (selectedEventId) {
      try {
        let response = await fetch(`http://localhost:3000/members/${member.id}/events/${selectedEventId}`, {
          method: "DELETE"
        });
        if (!response.ok) throw new Error("Erro ao desinscrever de evento");
        member.registeredEvents = member.registeredEvents.filter((evt) => evt.id != selectedEventId);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao desinscrever de evento");
      }
    }
  });

  let cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancelar";
  cancelButton.addEventListener("click", () => {
    this.show();
  });

  buttonContainer.appendChild(acceptButton);
  buttonContainer.appendChild(cancelButton);
  formContainer.appendChild(buttonContainer);
  container.appendChild(formContainer);
};

MenuMember.default = new MenuMember();
