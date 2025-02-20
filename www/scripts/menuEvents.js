"use strict";

/**
 * Classe que representa um Evento.
 */
let Event = function Event(type = "", description = "", date = "") {
  this.id = 0;      // Definido pelo servidor
  this.type = type; // Nome do tipo (convertido localmente)
  this.description = description;
  this.date = date;
};

Event.propertyLabels = {
  id: "Id",
  type: "Tipo",
  description: "Descrição",
  date: "Data"
};

function MenuEvent() {
  this.events = [];
  this.selectedEvent = null;
}

/** Desenha a tabela de eventos */
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
  table.appendChild(tbody);
  return table;
};

/** Carrega os eventos do servidor e converte typeId para typeName */
MenuEvent.prototype.loadFromServer = async function () {
  try {
    let response = await fetch("http://localhost:3000/events");
    if (!response.ok) throw new Error("Erro ao carregar eventos");
    let data = await response.json();
    // data contém objetos com { id, typeId, description, date }
    this.events = data.map((obj) => {
      let found = MenuEventType.default.eventTypes.find(et => et.id === obj.typeId);
      let typeName = found ? found.description : "(Tipo desconhecido)";
      let evt = new Event(typeName, obj.description, obj.date);
      evt.id = obj.id;
      return evt;
    });
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar eventos");
    this.events = [];
  }
};

/** Cria o formulário para criar/editar um evento */
MenuEvent.prototype.createForm = function (evt = null) {
  let formContainer = document.createElement("div");
  let title = document.createElement("h3");
  title.textContent = evt ? "Editar Evento" : "Criar Evento";
  formContainer.appendChild(title);

  let typeLabel = document.createElement("label");
  typeLabel.textContent = "Tipo: ";
  let typeSelect = document.createElement("select");
  MenuEventType.default.eventTypes.forEach((et) => {
    let opt = document.createElement("option");
    opt.value = et.id; // Guardar o ID
    opt.textContent = et.description;
    typeSelect.appendChild(opt);
  });
  if (evt) {
    let found = MenuEventType.default.eventTypes.find(et => et.description === evt.type);
    if (found) typeSelect.value = found.id;
  }

  let descLabel = document.createElement("label");
  descLabel.textContent = "Descrição: ";
  let descInput = document.createElement("input");
  descInput.type = "text";
  if (evt) descInput.value = evt.description;

  let dateLabel = document.createElement("label");
  dateLabel.textContent = "Data: ";
  let dateInput = document.createElement("input");
  dateInput.type = "date";
  if (evt) dateInput.value = evt.date;

  formContainer.appendChild(typeLabel);
  formContainer.appendChild(typeSelect);
  formContainer.appendChild(descLabel);
  formContainer.appendChild(descInput);
  formContainer.appendChild(dateLabel);
  formContainer.appendChild(dateInput);

  let btnContainer = document.createElement("div");
  let saveBtn = document.createElement("button");
  saveBtn.textContent = "Gravar";
  saveBtn.addEventListener("click", async () => {
    let typeId = Number(typeSelect.value);
    let description = descInput.value.trim();
    let date = dateInput.value;
    if (!description || !date) {
      alert("Preencha todos os campos");
      return;
    }
    if (evt) {
      try {
        let resp = await fetch(`http://localhost:3000/events/${evt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typeId, description, date })
        });
        if (!resp.ok) throw new Error("Erro ao atualizar evento");
        let found = MenuEventType.default.eventTypes.find(et => et.id === typeId);
        evt.type = found ? found.description : "(desconhecido)";
        evt.description = description;
        evt.date = date;
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar evento");
      }
    } else {
      try {
        let resp = await fetch("http://localhost:3000/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typeId, description, date })
        });
        if (!resp.ok) throw new Error("Erro ao criar evento");
        let created = await resp.json();
        let found = MenuEventType.default.eventTypes.find(et => et.id === typeId);
        let newEvt = new Event(found ? found.description : "(desconhecido)", description, date);
        newEvt.id = created.id;
        this.events.push(newEvt);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao criar evento");
      }
    }
  });

  let cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", () => {
    this.show();
  });
  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);
  formContainer.appendChild(btnContainer);
  return formContainer;
};

MenuEvent.prototype.showForm = function (evt = null) {
  let container = document.getElementById("events");
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(this.createForm(evt));
};

MenuEvent.prototype.show = async function () {
  let container = document.getElementById("events");
  while (container.firstChild) container.removeChild(container.firstChild);
  await MenuEventType.default.loadFromServer(); // Para ter os tipos atualizados
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
    if (this.selectedEvent) {
      this.showForm(this.selectedEvent);
    } else {
      alert("Selecione um evento");
    }
  });
  let deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Apagar";
  deleteBtn.addEventListener("click", async () => {
    if (!this.selectedEvent) {
      alert("Selecione um evento");
      return;
    }
    try {
      let resp = await fetch(`http://localhost:3000/events/${this.selectedEvent.id}`, {
        method: "DELETE"
      });
      if (!resp.ok) {
        let errData = await resp.json();
        alert(errData.message || "Erro ao apagar evento");
        return;
      }
      this.events = this.events.filter(e => e.id !== this.selectedEvent.id);
      this.selectedEvent = null;
      this.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar evento");
    }
  });

  btnContainer.appendChild(createBtn);
  btnContainer.appendChild(editBtn);
  btnContainer.appendChild(deleteBtn);
  container.appendChild(btnContainer);
};

MenuEvent.default = new MenuEvent();
