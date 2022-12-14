"use strict";

// Class definition
var KTAppCalendar = function () {
    // Shared variables
    // Calendar variables
    var calendar;
    var data = {
        id: '',
        eventName: '',
        eventDescription: '',
        eventhomeTeam: '',
        eventawayTeam: '',
        eventLocation: '',
        startDate: '',
        endDate: '',
        allDay: false
    };
    var popover;
    var popoverState = false;

    // Add event variables
    var eventName;
    var eventDescription;
    var eventhomeTeam;
    var eventawayTeam;
    var eventLocation;
    var startDatepicker;
    var startFlatpickr;
    var endDatepicker;
    var endFlatpickr;
    var startTimepicker;
    var startTimeFlatpickr;
    var endTimepicker
    var endTimeFlatpickr;
    var modal;
    var modalTitle;
    var form;
    var validator;
    var addButton;
    var submitButton;
    var cancelButton;
    var closeButton;

    // View event variables
    var viewEventName;
    var viewAllDay;
    var viewEventDescription;
    var viewEventLocation;
    var viewEventHomeTeam
    var viewEventAwayTeam
    var viewStartDate;
    var viewEndDate;
    var viewModal;
    var viewEditButton;
    var viewDeleteButton;


    // Private functions
    var initCalendarApp = function () {
        // Define variables
        var calendarEl = document.getElementById('kt_calendar_app');
        var todayDate = moment().startOf('day');
        var YM = todayDate.format('YYYY-MM');
        var YESTERDAY = todayDate.clone().subtract(1, 'day').format('YYYY-MM-DD');
        var TODAY = todayDate.format('YYYY-MM-DD');
        var TOMORROW = todayDate.clone().add(1, 'day').format('YYYY-MM-DD');

        // Init calendar --- more info: https://fullcalendar.io/docs/initialize-globals
        calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            initialDate: TODAY,
            navLinks: true, // can click day/week names to navigate views
            selectable: true,
            selectMirror: true,

            // Select dates action --- more info: https://fullcalendar.io/docs/select-callback
            select: function (arg) {
                hidePopovers();
                formatArgs(arg);
                handleNewEvent();
            },

            // Click event --- more info: https://fullcalendar.io/docs/eventClick
            eventClick: function (arg) {
                hidePopovers();

                formatArgs({
                    id: arg.event.id,
                    title: arg.event.title,
                    description: arg.event.extendedProps.description,
                    hometeam: arg.event.extendedProps.homeTeam,
                    awayteam: arg.event.extendedProps.awayTeam,
                    location: arg.event.extendedProps.location,
                    startStr: arg.event.startStr,
                    endStr: arg.event.endStr,
                    allDay: arg.event.allDay
                });
                handleViewEvent();
            },

            // MouseEnter event --- more info: https://fullcalendar.io/docs/eventMouseEnter
            eventMouseEnter: function (arg) {
                formatArgs({
                    id: arg.event.id,
                    title: arg.event.title,
                    description: arg.event.extendedProps.description,
                    hometeam: arg.event.extendedProps.homeTeam,
                    awayteam: arg.event.extendedProps.awayTeam,
                    location: arg.event.extendedProps.location,
                    startStr: arg.event.startStr,
                    endStr: arg.event.endStr,
                    allDay: arg.event.allDay
                });

                // Show popover preview
                initPopovers(arg.el);
            },

            editable: true,
            dayMaxEvents: true, // allow "more" link when too many events
            eventSources: [
                {
                    url: '/GameSchedule/GetGameSchedules',
                    type: 'GET',
                    dataType: "json",
                    error: function () {
                        alert('there was an error while fetching events!');
                    }
                }
            ],

            // Reset popovers when changing calendar views --- more info: https://fullcalendar.io/docs/datesSet
            datesSet: function () {
                hidePopovers();
            }
        });

        calendar.render();
    }

    // Initialize popovers --- more info: https://getbootstrap.com/docs/4.0/components/popovers/
    const initPopovers = (element) => {
        hidePopovers();

        // Generate popover content
        const startDate = data.allDay ? moment(data.startDate).format('Do MMM, YYYY') : moment(data.startDate).format('Do MMM, YYYY - h:mm a');
        const endDate = data.allDay ? moment(data.endDate).format('Do MMM, YYYY') : moment(data.endDate).format('Do MMM, YYYY - h:mm a');
        const popoverHtml = '<div class="fw-bolder mb-2">' + data.eventName + '</div><div class="fs-7"><span class="fw-bold">Start:</span> ' + startDate + '</div><div class="fs-7 mb-4"><span class="fw-bold">End:</span> ' + endDate + '</div><div id="kt_calendar_event_view_button" type="button" class="btn btn-sm btn-light-primary">View More</div>';

        // Popover options
        var options = {
            container: 'body',
            trigger: 'manual',
            boundary: 'window',
            placement: 'auto',
            dismiss: true,
            html: true,
            title: 'Event Summary',
            content: popoverHtml,
        }

        // Initialize popover
        popover = KTApp.initBootstrapPopover(element, options);

        // Show popover
        popover.show();

        // Update popover state
        popoverState = true;

        // Open view event modal
        handleViewButton();
    }

    // Hide active popovers
    const hidePopovers = () => {
        if (popoverState) {
            popover.dispose();
            popoverState = false;
        }
    }

    // Init validator
    const initValidator = () => {
        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validator = FormValidation.formValidation(
            form,
            {
                fields: {
                    'calendar_event_name': {
                        validators: {
                            notEmpty: {
                                message: 'Event name is required'
                            }
                        }
                    },
                    'calendar_event_start_date': {
                        validators: {
                            notEmpty: {
                                message: 'Start date is required'
                            }
                        }
                    },
                    'calendar_event_end_date': {
                        validators: {
                            notEmpty: {
                                message: 'End date is required'
                            }
                        }
                    }
                },

                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap: new FormValidation.plugins.Bootstrap5({
                        rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
                    })
                }
            }
        );
    }

    // Initialize datepickers --- more info: https://flatpickr.js.org/
    const initDatepickers = () => {
        startFlatpickr = flatpickr(startDatepicker, {
            enableTime: false,
            dateFormat: "Y-m-d",
        });

        endFlatpickr = flatpickr(endDatepicker, {
            enableTime: false,
            dateFormat: "Y-m-d",
        });

        startTimeFlatpickr = flatpickr(startTimepicker, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
        });

        endTimeFlatpickr = flatpickr(endTimepicker, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
        });
    }

    // Handle add button
    const handleAddButton = () => {
        addButton.addEventListener('click', e => {
            hidePopovers();

            // Reset form data
            data = {
                id: '',
                eventName: '',
                eventDescription: '',
                startDate: new Date(),
                endDate: new Date(),
                eventhomeTeam: '',
                eventawayTeam: '',
                allDay: false
            };
            handleNewEvent();
        });
    }

    const handleSubmitEvent = (e) => {
        // Prevent default button action
        e.preventDefault();
        // Validate form before submit
        if (validator) {
            validator.validate().then(function (status) {
                console.log('validated!');
                console.log("Submit button Add New Event");
                if (status == 'Valid') {

                    // Show loading indication
                    submitButton.setAttribute('data-kt-indicator', 'on');
                    // Disable submit button whilst loading
                    submitButton.disabled = true;
                    const allDayToggle = form.querySelector('#kt_calendar_datepicker_allday');

                    let allDayEvent = false;
                    if (allDayToggle.checked) { allDayEvent = true; }
                    if (startTimeFlatpickr.selectedDates.length === 0) { allDayEvent = true; }

                    // Merge date & time
                    var startDateTime = moment(startFlatpickr.selectedDates[0]).format();
                    var endDateTime = moment(endFlatpickr.selectedDates[endFlatpickr.selectedDates.length - 1]).format();
                    if (!allDayEvent) {
                        const startDate = moment(startFlatpickr.selectedDates[0]).format('YYYY-MM-DD');
                        const endDate = moment(endFlatpickr.selectedDates[0]).format('YYYY-MM-DD');
                        const startTime = moment(startTimeFlatpickr.selectedDates[0]).format('HH:mm:ss');
                        const endTime = moment(endTimeFlatpickr.selectedDates[0]).format('HH:mm:ss');

                        startDateTime = startDate + 'T' + startTime;
                        endDateTime = endDate + 'T' + endTime;
                    }

                    var postData = {
                        name: $('#Name').val(),
                        gameTypeId: $('#GameTypeId').val(),
                        teamId: $('#TeamId').val(),
                        playingAgainstId: $('#PlayingAgainstId').val(),
                        fieldLocationId: $('#FieldLocationId').val(),
                        startdate: startDateTime,
                        enddate: endDateTime,
                    };

                    debugger;
                    $.ajax({
                        type: "POST",
                        url: "/GameSchedule/AddGameSchedule",
                        data: postData,
                        dataType: "json",
                        success: function (response) {
                            debugger;
                            if (response.success) {
                                submitButton.removeEventListener("click", handleSubmitEvent, true);
                                // Show popup confirmation 
                                debugger;
                                Swal.fire({
                                    text: "New event added to calendar!",
                                    icon: "success",
                                    buttonsStyling: false,
                                    confirmButtonText: "Ok, got it!",
                                    customClass: {
                                        confirmButton: "btn btn-primary"
                                    }
                                }).then(function (result) {
                                    if (result.isConfirmed) {
                                        modal.hide();
                                        submitButton.setAttribute('data-kt-indicator', 'off');

                                        // Enable submit button after loading
                                        submitButton.disabled = false;

                                        // Detect if is all day event
                                        let allDayEvent = false;
                                        if (allDayToggle.checked) { allDayEvent = true; }
                                        if (startTimeFlatpickr.selectedDates.length === 0) { allDayEvent = true; }

                                        // Merge date & time
                                        var startDateTime = moment(startFlatpickr.selectedDates[0]).format();
                                        var endDateTime = moment(endFlatpickr.selectedDates[endFlatpickr.selectedDates.length - 1]).format();
                                        if (!allDayEvent) {
                                            const startDate = moment(startFlatpickr.selectedDates[0]).format('YYYY-MM-DD');
                                            const endDate = startDate;
                                            const startTime = moment(startTimeFlatpickr.selectedDates[0]).format('HH:mm:ss');
                                            const endTime = moment(endTimeFlatpickr.selectedDates[0]).format('HH:mm:ss');

                                            startDateTime = startDate + 'T' + startTime;
                                            endDateTime = endDate + 'T' + endTime;
                                        }

                                        debugger;
                                        // Add new event to calendar
                                        calendar.addEvent({
                                            id: uid(),
                                            title: eventName.value,
                                            description: $("#GameTypeId :selected").text(),
                                            location: $("#FieldLocationId :selected").text(),
                                            hometeam: $("#TeamId :selected").text(),
                                            awayteam: $("#PlayingAgainstId :selected").text(),
                                            start: startDateTime,
                                            end: endDateTime,
                                            allDay: allDayEvent
                                        });

                                        calendar.render();
                                        debugger;
                                        // Reset form for demo purposes only
                                        form.reset();
                                        initCalendarApp();
                                        submitButton.setAttribute('data-kt-indicator', 'off');
                                    }
                                });
                            }
                            else {
                                toastr.error("Error while inserting data", "Error");
                                submitButton.setAttribute('data-kt-indicator', 'off');
                            }
                        },
                        error: function (response) {
                            toastr.error("Error while inserting data", "Error");
                            submitButton.setAttribute('data-kt-indicator', 'off');
                        }
                    });
                } else {
                    // Show popup warning 
                    Swal.fire({
                        text: "Sorry, looks like there are some errors detected, please try again.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    submitButton.setAttribute('data-kt-indicator', 'off');
                }
            });
        }
    };

    // Handle add new event
    const handleNewEvent = () => {
        // Update modal title
        modalTitle.innerText = "Add a New Event";
        console.log("Add a New Event");

        modal.show();

        // Select datepicker wrapper elements
        const datepickerWrappers = form.querySelectorAll('[data-kt-calendar="datepicker"]');

        // Handle all day toggle
        const allDayToggle = form.querySelector('#kt_calendar_datepicker_allday');
        allDayToggle.addEventListener('click', e => {
            if (e.target.checked) {
                datepickerWrappers.forEach(dw => {
                    dw.classList.add('d-none');
                });
            } else {
                endFlatpickr.setDate(data.startDate, true, 'Y-m-d');
                datepickerWrappers.forEach(dw => {
                    dw.classList.remove('d-none');
                });
            }
        });

        populateForm(data);
         
        // Handle submit form
        submitButton.addEventListener('click', handleSubmitEvent , true);
    }

    // Handle edit event
    const handleEditEvent = () => {
        console.log("handleEditEvent");
        // Update modal title
        modalTitle.innerText = "Edit an Event";

        modal.show();

        // Select datepicker wrapper elements
        const datepickerWrappers = form.querySelectorAll('[data-kt-calendar="datepicker"]');

        // Handle all day toggle
        const allDayToggle = form.querySelector('#kt_calendar_datepicker_allday');
        allDayToggle.addEventListener('click', e => {
            if (e.target.checked) {
                datepickerWrappers.forEach(dw => {
                    dw.classList.add('d-none');
                });
            } else {
                endFlatpickr.setDate(data.startDate, true, 'Y-m-d');
                datepickerWrappers.forEach(dw => {
                    dw.classList.remove('d-none');
                });
            }
        });

        populateForm(data);
        console.log(data);

        // Handle submit form
        submitButton.addEventListener('click', function (e) {
            // Prevent default button action
            e.preventDefault();

            // Validate form before submit
            if (validator) {
                validator.validate().then(function (status) {
                    console.log('validated!');
                    console.log("Submit button Event in the Edit Event");

                    if (status == 'Valid') {
                        // Show loading indication
                        submitButton.setAttribute('data-kt-indicator', 'on');


                        // Disable submit button whilst loading
                        submitButton.disabled = true;

                        // Simulate form submission
                        setTimeout(function () {
                            // Simulate form submission
                            submitButton.removeAttribute('data-kt-indicator');


                            // Detect if is all day event
                            let allDayEvent = false;
                            if (allDayToggle.checked) { allDayEvent = true; }
                            if (startTimeFlatpickr.selectedDates.length === 0) { allDayEvent = true; } 
                            // Merge date & time
                            var startDateTime = moment(startFlatpickr.selectedDates[0]).format();
                            var endDateTime = moment(endFlatpickr.selectedDates[endFlatpickr.selectedDates.length - 1]).format();
                            if (!allDayEvent) {
                                const startDate = moment(startFlatpickr.selectedDates[0]).format('YYYY-MM-DD');
                                const endDate = moment(endFlatpickr.selectedDates[0]).format('YYYY-MM-DD');
                                const startTime = moment(startTimeFlatpickr.selectedDates[0]).format('HH:mm:ss');
                                const endTime = moment(endTimeFlatpickr.selectedDates[0]).format('HH:mm:ss');

                                startDateTime = startDate + 'T' + startTime;
                                endDateTime = endDate + 'T' + endTime;
                            }

                            var postEditData = {
                                id: data.id,
                                name: $('#Name').val(),
                                gameTypeId: $('#GameTypeId').val(),
                                teamId: $('#TeamId').val(),
                                playingAgainstId: $('#PlayingAgainstId').val(),
                                fieldLocationId: $('#FieldLocationId').val(),
                                startdate: startDateTime,
                                enddate: endDateTime,
                            };
                            console.log(postEditData);
                            $.ajax({
                                type: "POST",
                                url: form.action,
                                data: postEditData,
                                dataType: "json",
                                success: function (response) {
                                    if (response.success) {
                                        // Show popup confirmation 
                                        Swal.fire({
                                            text: "Event has been updated to calendar!",
                                            icon: "success",
                                            buttonsStyling: false,
                                            confirmButtonText: "Ok, got it!",
                                            customClass: {
                                                confirmButton: "btn btn-primary"
                                            }
                                        }).then(function (result) {
                                            if (result.isConfirmed) {
                                                modal.hide();
                                                submitButton.setAttribute('data-kt-indicator', 'off');

                                                // Enable submit button after loading
                                                submitButton.disabled = false;
                                                console.log(response.success);

                                                //calendar.render();
                                                calendar.refetchEvents();

                                               //Reset form for demo purposes only
                                               form.reset();
                                            }
                                        });
                                    }
                                    else {
                                        toastr.error("Error while inserting data", "Error");
                                        submitButton.setAttribute('data-kt-indicator', 'off');
                                    }
                                }
                            });
                        }, 2000);
                    } else {
                        // Show popup warning 
                        Swal.fire({
                            text: "Sorry, looks like there are some errors detected, please try again.",
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        });
                    }
                });
            }
        });
    }

    // Handle view event
    const handleViewEvent = () => {
        debugger;
        viewModal.show();

        // Detect all day event
        var eventNameMod;
        var startDateMod;
        var endDateMod;

        // Generate labels
        if (data.allDay) {
            eventNameMod = 'All Day';
            startDateMod = moment(data.startDate).format('Do MMM, YYYY');
            endDateMod = moment(data.endDate).format('Do MMM, YYYY');
        } else {
            eventNameMod = '';
            startDateMod = moment(data.startDate).format('Do MMM, YYYY - h:mm a');
            endDateMod = moment(data.endDate).format('Do MMM, YYYY - h:mm a');
        }

        // Populate view data
        viewEventName.innerText = data.eventName;
        viewAllDay.innerText = eventNameMod;
        viewEventDescription.innerText = data.eventDescription ? data.eventDescription : '--';
        viewEventLocation.innerText = data.eventLocation ? data.eventLocation : '--';
        viewEventHomeTeam.innerText = data.eventhomeTeam ? data.eventhomeTeam : '--';
        viewEventAwayTeam.innerText = data.eventawayTeam ? data.eventawayTeam : '--';
        viewStartDate.innerText = startDateMod;
        viewEndDate.innerText = endDateMod;
    }

    // Handle delete event
    const handleDeleteEvent = () => {
        viewDeleteButton.addEventListener('click', e => {
            e.preventDefault();

            Swal.fire({
                text: "Are you sure you would like to delete this event?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                $.ajax({
                    url: '/GameSchedule/DeleteGameSchedule' + "?id=" + data.id,
                    type: 'Delete',
                    data: data.id,
                    success: function (data) {
                        if (data.success) {
                            console.log(data.success);
                            calendar.getEventById(data.id).remove();
                        }
                    },
                });

                if (result.value) {
                    calendar.getEventById(data.id).remove();

                    viewModal.hide(); // Hide modal				
                } else if (result.dismiss === 'cancel') {
                    Swal.fire({
                        text: "Your event was not deleted!.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary",
                        }
                    });
                }
            });
        });
    }

    // Handle edit button
    const handleEditButton = () => {
        console.log("Click on the Edit Event");
        viewEditButton.addEventListener('click', e => {
            e.preventDefault();

            viewModal.hide();
            handleEditEvent();
        });
    }

    // Handle cancel button
    const handleCancelButton = () => {
        // Edit event modal cancel button
        cancelButton.addEventListener('click', function (e) {
            e.preventDefault();

            Swal.fire({
                text: "Are you sure you would like to cancel?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, cancel it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                if (result.value) {
                    form.reset(); // Reset form	
                    modal.hide(); // Hide modal				
                } else if (result.dismiss === 'cancel') {
                    Swal.fire({
                        text: "Your form has not been cancelled!.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary",
                        }
                    });
                }
            });
        });
    }

    // Handle close button
    const handleCloseButton = () => {
        // Edit event modal close button
        closeButton.addEventListener('click', function (e) {
            e.preventDefault();

            Swal.fire({
                text: "Are you sure you would like to cancel?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, cancel it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                if (result.value) {
                    form.reset(); // Reset form	
                    modal.hide(); // Hide modal				
                } else if (result.dismiss === 'cancel') {
                    Swal.fire({
                        text: "Your form has not been cancelled!.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary",
                        }
                    });
                }
            });
        });
    }

    // Handle view button
    const handleViewButton = () => {
        const viewButton = document.querySelector('#kt_calendar_event_view_button');
        viewButton.addEventListener('click', e => {
            e.preventDefault();

            hidePopovers();
            handleViewEvent();
        });
    }

    // Helper functions

    // Reset form validator on modal close
    const resetFormValidator = (element) => {
        // Target modal hidden event --- For more info: https://getbootstrap.com/docs/5.0/components/modal/#events
        element.addEventListener('hidden.bs.modal', e => {
            if (validator) {
                // Reset form validator. For more info: https://formvalidation.io/guide/api/reset-form
                validator.resetForm(true);
            }
        });
    }

    // Populate form 
    const populateForm = () => {
        console.log("populateForm");
        eventName.value = data.eventName ? data.eventName : '';
        $("#Name option:contains(" + data.eventName + ")").attr('selected', 'selected');
        $("#GameTypeId option:contains(" + data.eventDescription + ")").attr('selected', 'selected');
        $("#TeamId option:contains(" + data.eventhomeTeam + ")").attr('selected', 'selected');
        $("#PlayingAgainstId option:contains(" + data.eventawayTeam + ")").attr('selected', 'selected');
        $("#FieldLocationId option:contains(" + data.eventLocation + ")").attr('selected', 'selected');
      
        startFlatpickr.setDate(data.startDate, true, 'Y-m-d');

        // Handle null end dates
        const endDate = data.endDate ? data.endDate : moment(data.startDate).format();
        endFlatpickr.setDate(endDate, true, 'Y-m-d');

        const allDayToggle = form.querySelector('#kt_calendar_datepicker_allday');
        const datepickerWrappers = form.querySelectorAll('[data-kt-calendar="datepicker"]');
        if (data.allDay) {
            allDayToggle.checked = true;
            datepickerWrappers.forEach(dw => {
                dw.classList.add('d-none');
            });
        } else {
            startTimeFlatpickr.setDate(data.startDate, true, 'Y-m-d H:i');
            endTimeFlatpickr.setDate(data.endDate, true, 'Y-m-d H:i');
            endFlatpickr.setDate(data.startDate, true, 'Y-m-d');
            allDayToggle.checked = false;
            datepickerWrappers.forEach(dw => {
                dw.classList.remove('d-none');
            });
        }
    }

    // Format FullCalendar reponses
    const formatArgs = (res) => {
        data.id = res.id;
        data.eventName = res.title;
        data.eventDescription = res.description;
        data.eventLocation = res.location;
        data.eventhomeTeam = res.hometeam;
        data.eventawayTeam = res.awayteam;
        data.startDate = res.startStr;
        data.endDate = res.endStr;
        data.allDay = res.allDay;
    }

    // Generate unique IDs for events
    const uid = () => {
        return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    }

    return {
        // Public Functions
        init: function () {
            // Define variables
            // Add event modal
            const element = document.getElementById('kt_modal_add_event');
            form = element.querySelector('#kt_modal_add_event_form');
            eventName = form.querySelector('[name="Name"]');
            eventDescription = form.querySelector('[name="GameTypeId"]');
            eventhomeTeam = form.querySelector('[name="TeamId"]');
            eventawayTeam = form.querySelector('[name="PlayingAgainstId"]');
            eventLocation = form.querySelector('[name="FieldLocationId"]');
            startDatepicker = form.querySelector('[name="StartDate"]');
            endDatepicker = form.querySelector('[name="EndDate"]');
            startTimepicker = form.querySelector('#kt_calendar_datepicker_start_time');
            endTimepicker = form.querySelector('#kt_calendar_datepicker_end_time');
            addButton = document.querySelector('[data-kt-calendar="add"]');
            submitButton = form.querySelector('#kt_modal_add_event_submit');
            cancelButton = form.querySelector('#kt_modal_add_event_cancel');
            closeButton = element.querySelector('#kt_modal_add_event_close'); 
            modalTitle = form.querySelector('[data-kt-calendar="title"]');
            modal = new bootstrap.Modal(element);

            // View event modal
            const viewElement = document.getElementById('kt_modal_view_event');
            viewModal = new bootstrap.Modal(viewElement);
            viewEventName = viewElement.querySelector('[data-kt-calendar="event_name"]');
            viewAllDay = viewElement.querySelector('[data-kt-calendar="all_day"]');
            viewEventDescription = viewElement.querySelector('[data-kt-calendar="event_description"]');
            viewEventLocation = viewElement.querySelector('[data-kt-calendar="event_location"]');
            viewEventHomeTeam = viewElement.querySelector('[data-kt-calendar="event_home_team"]');
            viewEventAwayTeam = viewElement.querySelector('[data-kt-calendar="event_away_team"]');
            viewStartDate = viewElement.querySelector('[data-kt-calendar="event_start_date"]');
            viewEndDate = viewElement.querySelector('[data-kt-calendar="event_end_date"]');
            viewEditButton = viewElement.querySelector('#kt_modal_view_event_edit');
            viewDeleteButton = viewElement.querySelector('#kt_modal_view_event_delete');

            initCalendarApp();
            initValidator();
            initDatepickers();
            handleEditButton();
            handleAddButton();
            handleDeleteEvent();
            handleCancelButton();
            handleCloseButton();
            resetFormValidator(element);
        }
    };
}();

// On document ready
KTUtil.onDOMContentLoaded(function () {
    KTAppCalendar.init();
});
