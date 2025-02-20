"use strict";

/**
 * Classe que representa um Tipo de Evento.
 * Os IDs virão do servidor.
 */
let EventType = function EventType(description = "") {
  this.id = 0;
  this.description = description;
};

/**
 * Rótulos para exibição na tabela.
 */
EventType.propertyLabels = {
  id: "Id",
  description: "Descrição"
};

/**
 * Classe para gerenciar os Tipos de Eventos e sua interface.
 */
function MenuEventType() {
  this.eventTypes = [];
  this.selectedEvent = null;
}

/**
 * Cria a tabela HTML com os tipos de evento.
 */
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
  if (this.eventTypes.length > 0) {
    this.eventTypes.forEach((eventType) => {
      let row = document.createElement("tr");
      row.addEventListener("click", () => {
        tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        this.selectedEvent = eventType;
      });
      for (let prop in EventType.propertyLabels) {
        let cell = document.createElement("td");
        cell.textContent = eventType[prop];
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    });
  }
  table.appendChild(tbody);
  return table;
};

/**
 * Carrega os tipos de evento do servidor.
 */
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

/**
 * Cria o formulário para criar/editar um Tipo de Evento.
 */
MenuEventType.prototype.createForm = function (event = null) {
  let formContainer = document.createElement("div");
  let formTitle = document.createElement("h3");
  formTitle.textContent = event ? "Editar Tipo de Evento" : "Criar Tipo de Evento";
  formContainer.appendChild(formTitle);

  let label = document.createElement("label");
  label.textContent = "Descrição: ";
  let input = document.createElement("input");
  input.type = "text";
  input.id = "eventTypeDescription";
  if (event) input.value = event.description;
  formContainer.appendChild(label);
  formContainer.appendChild(input);

  let buttonContainer = document.createElement("div");
  let saveButton = document.createElement("button");
  saveButton.textContent = "Gravar";
  saveButton.addEventListener("click", async () => {
    let description = input.value.trim();
    if (!description) {
      alert("Descrição obrigatória!");
      return;
    }
    if (event) {
      // Atualiza (PUT)
      try {
        let response = await fetch(`http://localhost:3000/eventTypes/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description })
        });
        if (!response.ok) throw new Error("Erro ao atualizar");
        event.description = description;
        this.show();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar o tipo de evento");
      }
    } else {
      // Cria (POST)
      try {
        let response = await fetch("http://localhost:3000/eventTypes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description })
        });
        if (!response.ok) throw new Error("Erro ao criar");
        let created = await response.json();
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
 * Exibe o formulário de criação/edição.
 */
MenuEventType.prototype.showForm = function (event = null) {
  let container = document.getElementById("eventTypes");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(this.createForm(event));
};

/**
 * Exibe a tela principal (tabela + botões) para tipos de evento.
 */
MenuEventType.prototype.show = async function () {
  let container = document.getElementById("eventTypes");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
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
      alert("Selecione um item!");
    }
  });

  let deleteButton = document.createElement("button");
  deleteButton.textContent = "Apagar";
  deleteButton.addEventListener("click", async () => {
    if (!this.selectedEvent) {
      alert("Selecione um item!");
      return;
    }
    try {
      let response = await fetch(`http://localhost:3000/eventTypes/${this.selectedEvent.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        let errData = await response.json();
        alert(errData.message || "Erro ao apagar");
        return;
      }
      this.eventTypes = this.eventTypes.filter((et) => et.id !== this.selectedEvent.id);
      this.selectedEvent = null;
      this.show();
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar tipo de evento");
    }
  });

  buttonContainer.appendChild(createButton);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);
  container.appendChild(buttonContainer);
};

MenuEventType.default = new MenuEventType();
