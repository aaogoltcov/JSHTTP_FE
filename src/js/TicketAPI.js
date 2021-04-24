'use strict';
import { v4 as uuidv4 } from 'uuid';

export default class TicketAPI {
  constructor() {
    this.form = document.querySelector('[data-widget=ticket_form]');
    this.list = document.querySelector('[data-widget=ticket_list]');
    this.url = 'http://jshttpbe.herokuapp.com';
    this.xhr = new XMLHttpRequest();
  }

  init() {
    this.clickEventListener();
    this.mouseMoveEventListener();
    this.createTicket();
    this.xhrLoadEventListener();
    this.getAllTickets();
  }

  // form
  createTicket() {
    this.form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      this.submitForm();
      this.closeForm();
      this.clearForm();
    })
  }

  submitForm( status=false ) {
    let params = Array.from(this.form.elements)
      .filter(({ name }) => name)
      .map(({ name, value }) => `${ name }=${ encodeURIComponent(value) }`)
      .join('&');
    if ( this.currentTicket ) {
      params = params
        + `&id=${ this.currentTicket.id }`
        + `&created=${ this.currentTicket.created }`
        + `&status=${ status  ? this.currentStatus === true 
                              ? "checked": this.currentStatus === "delete" 
                              ? this.currentStatus : "" : this.currentTicket.status }`
    } else {
      params = params
        + `&id=${ uuidv4() }`
        + `&created=${ new Date().toLocaleDateString() } ${ new Date().toLocaleTimeString() }`
        + '&status='
    }
    this.xhr.open('POST', this.url, true);
    this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    this.xhr.send( params );
    this.currentTicket = undefined;
    this.currentStatus = undefined;
    this.clearForm();
  }

  closeForm() {
    this.form.classList.add('hidden');
  }

  openForm() {
    this.form.classList.remove('hidden');
  }

  fillForm( name, value ) {
    this.form.querySelector('[data-form=name]').value = name;
    this.form.querySelector('[data-form=description]').value = value;
  }

  clearForm() {
    this.form.querySelector('[data-form=name]').value = "";
    this.form.querySelector('[data-form=description]').value = "";
  }

  // API requests
  xhrLoadEventListener() {
    this.xhr.addEventListener('load', () => {
      if ( this.xhr.status >= 200 && this.xhr.status < 300 ) {

        try {
          if ( this.xhr.status === 291 || this.xhr.status === 294) {    // get all tickets
            this.response = JSON.parse(this.xhr.responseText);
            this.redrawAllTickets();
          } else if ( this.xhr.status === 292 ) {                       // get ticket by id
            this.currentTicket = JSON.parse(this.xhr.responseText);
            if ( !this.form.classList.contains('hidden') ) {
              this.fillForm(this.currentTicket.name, this.currentTicket.description);
            } else {
              this.fillForm(this.currentTicket.name, this.currentTicket.description);
              this.submitForm( true )
              this.clearForm();
            }
          } else if ( this.xhr.status === 293 ) {                       //
            this.getAllTickets();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  getAllTickets() {
    this.xhr.open('GET', this.url + '?method=' + encodeURIComponent('allTickets'), true);
    this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    this.xhr.send();
  }

  getTicketById(id) {
    this.xhr.open('GET',  this.url
                                      + '?method='
                                      + encodeURIComponent('ticketById')
                                      + '&id='
                                      + encodeURIComponent(id), true);
    this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    this.xhr.send();
  }

  // Redraw UI
  redrawAllTickets() {
    this.list.textContent = '';
    this.response.forEach(element => {
      this.list.insertAdjacentHTML('beforeend', `
      <li data-id="${ element.id }">
        <input type="checkbox" data-element="ticket_checkbox" ${ element.status }>
        <span class="ticket_name" data-element="ticket_name">${ element.name }</span>
        <span class="ticket_date" data-element="ticket_date">${ element.created }</span>
        <span class="ticket_edit" data-element="ticket_edit">Правка</span>
        <span class="ticket_delete" data-element="ticket_delete">Удалить</span>
        <span class="ticket_description hidden" data-element="ticket_description">${ element.description }</span>
      </li>
      `)
    })
  }

  // Events
  clickEventListener() {
    document.body.addEventListener('click', event => {
      if ( event.target.dataset.element === 'ticket_name' ) {
        event.target.parentNode.querySelector('[data-element=ticket_description]').classList.toggle('hidden');
      } else if ( event.target.dataset.form === 'close_form' ) {
        this.form.classList.add('hidden');
      } else if ( event.target.dataset.element === 'add_ticket' ) {
        this.form.classList.remove('hidden');
      } else if (event.target.dataset.element === 'ticket_edit') {
        this.getTicketById(event.target.parentNode.dataset.id);
        this.openForm();
      } else if ( event.target.dataset.element === 'ticket_checkbox' ) {
        this.currentStatus = event.target.checked;
        this.getTicketById( event.target.parentNode.dataset.id );
      } else if ( event.target.dataset.element === 'ticket_delete' ) {
        this.currentStatus = 'delete';
        this.getTicketById( event.target.parentNode.dataset.id );
      }
    })
  }

  mouseMoveEventListener() {
    document.body.addEventListener('mousemove', event => {
      if (  event.target.dataset.element === 'ticket_edit'
        || event.target.dataset.element === 'ticket_delete'
        || event.target.dataset.element === 'ticket_name'
      ) {
        event.target.style.cursor = 'pointer';
      }
    })
  }
}
