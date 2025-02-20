"use strict";

/**
 * Classe que representa um Tipo de Evento.
 */
let EventType = function EventType(description = "") {
  this.id = 0; // Será definido pelo servidor
  this.description = description;
};

EventType.propertyLabels = {
  id: "Id",
  description: "Descrição"
};

/**
 * Classe para gerenciar os Tipos de Evento e sua interface.
 */
function MenuEventType() {
  this.eventTypes = [];
  this.selectedEvent = null;
}

/** Cria a tabela HTML com os tipos de evento */
MenuEventType.prototype.toTable = function () {
  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let headerRow = document.createElement("tr");

  for (let prop in EventType.propertyLabels) {
    let th = document.createElement("th");
    th.textContent = EventType.propertyLabels[prop];
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  this.eventTypes.forEach((et) => {
    let row = document.createElement("tr");
    row.addEventListener("click", () => {
      tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
      row.classList.add("selected");
      this.selectedEvent = et;
    });
    for (let prop in EventType.propertyLabels) {
      let cell = document.createElement("td");
      cell.textContent = et[prop];
      row.appendChild(cell);
    }
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
};

/** Carrega os tipos de evento do servidor */
MenuEventType.prototype.loadFromServer = async function () {
  try {
    let response = await fetch("http://localhost:3000/eventTypes");
    if (!response.ok) throw new Error("Erro ao carregar os tipos de evento");
    let data = await response.json();
    this.eventTypes = data.map((obj) => {
      let et = new EventType(obj.description);
      et.id = obj.id;
      return et;
    });
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar os tipos de evento");
    this.eventTypes = [];
  }
};

/** Cria o formulário para criar/editar um Tipo de Evento */
MenuEventType.prototype.createForm = function (eventType = null) {
  let formContainer = document.createElement("div");
  let title = document.createElement("h3");
  title.textContent = eventType ? "Editar Tipo de Evento" : "Criar Tipo de Evento";
  formContainer.appendChild(title);

  let label = document.createElement("label");
  label.textContent = "Descrição: ";
  let input = document.createElement("input");
  input.type = "text";
  if (eventType) input.value = eventType.description;
  formContainer.appendChild(label);
  formContainer.appendChild(input);

  let btnContainer = document.createElement("div");
  let saveBtn = document.createElement("button");
  saveBtn.textContent = "Gravar";
  saveBtn.addEventListener("click", async () => {
    let desc = input.value.trim();
    if (!desc) {
      alert("Descrição obrigatória");
      return;
    }
    if (eventType) {
      // Atualiza (PUT)
      try {
        let resp = await fetch(`http://localhost:3000/eventTypes/${eventType.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: desc })
        });
        if (!resp.ok) throw new Error("Erro ao atualizar");
        eventType.description = desc;
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar tipo de evento");
      }
    } else {
      // Cria (POST)
      try {
        let resp = await fetch("http://localhost:3000/eventTypes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: desc })
        });
        if (!resp.ok) throw new Error("Erro ao criar tipo de evento");
        let created = await resp.json();
        let newET = new EventType(created.description);
        newET.id = created.id;
        this.eventTypes.push(newET);
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao criar tipo de evento");
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

/** Exibe o formulário de criação/edição */
MenuEventType.prototype.showForm = function (eventType = null) {
  let container = document.getElementById("eventTypes");
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(this.createForm(eventType));
};

/** Exibe a tela principal dos Tipos de Evento */
MenuEventType.prototype.show = async function () {
  let container = document.getElementById("eventTypes");
  while (container.firstChild) container.removeChild(container.firstChild);
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
      alert("Selecione um tipo de evento!");
    }
  });
  let deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Apagar";
  deleteBtn.addEventListener("click", async () => {
    if (!this.selectedEvent) {
      alert("Selecione um tipo de evento!");
      return;
    }
    try {
      let resp = await fetch(`http://localhost:3000/eventTypes/${this.selectedEvent.id}`, {
        method: "DELETE"
      });
      if (!resp.ok) {
        let errData = await resp.json();
        alert(errData.message || "Não foi possível apagar");
        return;
      }
      this.eventTypes = this.eventTypes.filter(et => et.id !== this.selectedEvent.id);
      this.selectedEvent = null;
      this.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar tipo de evento");
    }
  });

  btnContainer.appendChild(createBtn);
  btnContainer.appendChild(editBtn);
  btnContainer.appendChild(deleteBtn);
  container.appendChild(btnContainer);
};

MenuEventType.default = new MenuEventType();
