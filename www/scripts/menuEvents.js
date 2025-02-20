"use strict";

/**
 * Classe que representa um Evento.
 * O ID será definido pelo servidor.
 */
let Event = function Event(type = "", description = "", date = "") {
  this.id = 0;
  this.type = type; // string com a descrição do tipo
  this.description = description;
  this.date = date;
};

Event.propertyLabels = {
  id: "Id",
  type: "Tipo",
  description: "Descrição",
  date: "Data"
};

/**
 * Classe para gerenciar os Eventos e sua interface.
 */
function MenuEvent() {
  this.events = [];
  this.selectedEvent = null;
}

/**
 * Cria a tabela HTML para os eventos.
 */
MenuEvent.prototype.toTable = function () {
  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let headerRow = document.createElement("tr");
  for (let prop in Event.propertyLabels) {
    let th = document.createElement("th");
    th.textContent = Event.propertyLabels[prop];
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  let tbody = document.createElement("tbody");
  if (this.events.length > 0) {
    this.events.forEach((evt) => {
      let row = document.createElement("tr");
      row.addEventListener("click", () => {
        tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        this.selectedEvent = evt;
      });
      for (let prop in Event.propertyLabels) {
        let cell = document.createElement("td");
        cell.textContent = evt[prop];
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    });
  }
  table.appendChild(tbody);
  return table;
};

/**
 * Carrega os eventos do servidor.
 */
MenuEvent.prototype.loadFromServer = async function () {
  try {
    let response = await fetch("http://localhost:3000/events");
    if (!response.ok) throw new Error("Erro ao carregar eventos");
    let data = await response.json();
    this.events = data.map((obj) => {
      // Observe que no servidor "events" retorna { id, typeId, description, date }
      // Se o servidor também retornar "type" como string, ótimo;
      // Caso contrário, precisamos converter "typeId" -> "type" consultando eventTypes
      let evt = new Event(obj.type, obj.description, obj.date);
      evt.id = obj.id;
      return evt;
    });
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar eventos");
    this.events = [];
  }
};

/**
 * Cria o formulário para criar/editar um Evento.
 */
MenuEvent.prototype.createForm = function (evt = null) {
  let formContainer = document.createElement("div");
  let formTitle = document.createElement("h3");
  formTitle.textContent = evt ? "Editar Evento" : "Criar Evento";
  formContainer.appendChild(formTitle);

  // Seletor de Tipo (usa os tipos carregados no MenuEventType)
  let typeLabel = document.createElement("label");
  typeLabel.textContent = "Tipo: ";
  let typeInput = document.createElement("select");
  typeInput.id = "eventType";

  // Utiliza os tipos disponíveis
  let eventTypes = MenuEventType.default.eventTypes;
  if (eventTypes.length > 0) {
    eventTypes.forEach((et) => {
      let option = document.createElement("option");
      option.value = et.description; 
      option.textContent = et.description;
      typeInput.appendChild(option);
    });
  } else {
    let noOption = document.createElement("option");
    noOption.textContent = "Nenhum tipo disponível";
    noOption.disabled = true;
    noOption.selected = true;
    typeInput.appendChild(noOption);
  }
  if (evt) typeInput.value = evt.type;

  // Campo Descrição
  let descriptionLabel = document.createElement("label");
  descriptionLabel.textContent = "Descrição: ";
  let descriptionInput = document.createElement("input");
  descriptionInput.type = "text";
  descriptionInput.id = "eventDescription";
  if (evt) descriptionInput.value = evt.description;

  // Campo Data
  let dateLabel = document.createElement("label");
  dateLabel.textContent = "Data: ";
  let dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "eventDate";
  if (evt) dateInput.value = evt.date;

  formContainer.appendChild(typeLabel);
  formContainer.appendChild(typeInput);
  formContainer.appendChild(descriptionLabel);
  formContainer.appendChild(descriptionInput);
  formContainer.appendChild(dateLabel);
  formContainer.appendChild(dateInput);

  let buttonContainer = document.createElement("div");
  let saveButton = document.createElement("button");
  saveButton.textContent = "Gravar";
  saveButton.addEventListener("click", async () => {
    let type = typeInput.value;
    let description = descriptionInput.value.trim();
    let date = dateInput.value;
    if (!description || !date) {
      alert("Preencha todos os campos");
      return;
    }
    // Precisamos enviar typeId (número), então:
    let typeId = getTypeIdByDescription(type);
    if (!typeId) {
      alert("Tipo inválido");
      return;
    }
    if (evt) {
      // Atualização (PUT)
      try {
        let response = await fetch(`http://localhost:3000/events/${evt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typeId, description, date })
        });
        if (!response.ok) throw new Error("Erro ao atualizar evento");
        evt.type = type;
        evt.description = description;
        evt.date = date;
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar evento");
      }
    } else {
      // Criação (POST)
      try {
        let response = await fetch("http://localhost:3000/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typeId, description, date })
        });
        if (!response.ok) throw new Error("Erro ao criar evento");
        let created = await response.json();
        let newEvt = new Event(type, description, date);
        newEvt.id = created.id;
        this.events.push(newEvt);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao criar evento");
      }
    }
  });

  let cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancelar";
  cancelButton.addEventListener("click", () => {
    this.show();
  });

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);
  formContainer.appendChild(buttonContainer);
  return formContainer;
};

/**
 * Função auxiliar que retorna o typeId dado uma descrição,
 * pesquisando em MenuEventType.default.eventTypes.
 */
function getTypeIdByDescription(description) {
  let et = MenuEventType.default.eventTypes.find((t) => t.description === description);
  return et ? et.id : null;
}

MenuEvent.prototype.showForm = function (evt = null) {
  let container = document.getElementById("events");
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(this.createForm(evt));
};

MenuEvent.prototype.show = async function () {
  let container = document.getElementById("events");
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
    if (this.selectedEvent) {
      this.showForm(this.selectedEvent);
    } else {
      alert("Selecione um evento");
    }
  });

  let deleteButton = document.createElement("button");
  deleteButton.textContent = "Apagar";
  deleteButton.addEventListener("click", async () => {
    if (!this.selectedEvent) {
      alert("Selecione um evento");
      return;
    }
    try {
      let response = await fetch(`http://localhost:3000/events/${this.selectedEvent.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        let errData = await response.json();
        alert(errData.message || "Erro ao apagar evento");
        return;
      }
      this.events = this.events.filter((e) => e.id !== this.selectedEvent.id);
      this.selectedEvent = null;
      this.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar evento");
    }
  });

  buttonContainer.appendChild(createButton);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);
  container.appendChild(buttonContainer);
};

MenuEvent.default = new MenuEvent();
