"use strict";

// Class definition
var KTCustomersList = function () {
    // Define shared variables
    var datatable;
    var filterMonth;
    var filterPayment;
    var table,
        t,
        n,
        r

    // Private functions
    var initCustomerList = function () {
        // Set date data order
        const tableRows = table.querySelectorAll('tbody tr');

        tableRows.forEach(row => {
            const dateRow = row.querySelectorAll('td');
            const realDate = moment(dateRow[5].innerHTML, "DD MMM YYYY, LT").format(); // select date from 5th column in table
            dateRow[5].setAttribute('data-order', realDate);
        });
    }

    // Search Datatable --- official docs reference: https://datatables.net/reference/api/search()
    var handleSearchDatatable = () => {
        const filterSearch = document.querySelector('[data-kt-customer-table-filter="search"]');
        filterSearch.addEventListener('keyup', function (e) {
            datatable.search(e.target.value).draw();
        });
    }

    // Filter Datatable
    var handleFilterDatatable = () => {
        // Select filter options
        filterMonth = $('[data-kt-customer-table-filter="month"]');
        filterPayment = document.querySelectorAll('[data-kt-customer-table-filter="payment_type"] [name="payment_type"]');
        const filterButton = document.querySelector('[data-kt-customer-table-filter="filter"]');

        // Filter datatable on submit
        filterButton.addEventListener('click', function () {
            // Get filter values
            const monthValue = filterMonth.val();
            let paymentValue = '';

            // Get payment value
            filterPayment.forEach(r => {
                if (r.checked) {
                    paymentValue = r.value;
                }

                // Reset payment value if "All" is selected
                if (paymentValue === 'all') {
                    paymentValue = '';
                }
            });

            // Build filter string from filter options
            const filterString = monthValue + ' ' + paymentValue;

            // Filter datatable --- official docs reference: https://datatables.net/reference/api/search()
            datatable.search(filterString).draw();
        });
    }

    // Delete customer
    var handleDeleteRows = () => {
        // Select all delete buttons
        const deleteButtons = table.querySelectorAll('[data-kt-customer-table-filter="delete_row"]');
        deleteButtons.forEach(d => {
            // Delete button on click
            d.addEventListener('click', function (e) {
                e.preventDefault();

                // Select parent row
                const parent = e.target.closest('tr');

                // Get customer name
                const customerName = parent.querySelectorAll('td')[1].innerText;
                var id = $(this).attr("data-id")
                // SweetAlert2 pop up --- official docs reference: https://sweetalert2.github.io/
                Swal.fire({
                    text: "Are you sure you want to delete " + customerName + "?",
                    icon: "warning",
                    showCancelButton: true,
                    buttonsStyling: false,
                    confirmButtonText: "Yes, delete!",
                    cancelButtonText: "No, cancel",
                    customClass: {
                        confirmButton: "btn fw-bold btn-danger",
                        cancelButton: "btn fw-bold btn-active-light-primary"
                    }
                }).then(function (result) {
                    if (result.value) {
                        $.ajax({
                            url: '/Coach/DeleteCoach' + "?id=" + id,
                            type: 'Delete',
                            data: id,
                            success: function (data) {
                                if (data.success) {
                                    Swal.fire({
                                        text: "You have deleted " + customerName + "!.",
                                        icon: "success",
                                        buttonsStyling: false,
                                        confirmButtonText: "Ok, got it!",
                                        customClass: {
                                            confirmButton: "btn fw-bold btn-primary",
                                        }
                                    }).then(function () {
                                        // Remove current row
                                        datatable.row($(parent)).remove().draw();
                                    });

                                }
                                else {
                                    Swal.fire({
                                        text: customerName + " was not deleted because it associated with Team.",
                                        icon: "error",
                                        buttonsStyling: false,
                                        confirmButtonText: "Ok, got it!",
                                        customClass: {
                                            confirmButton: "btn fw-bold btn-primary",
                                        }
                                    });
                                }
                            },
                        });
                    }
                });
            })
        });
    }

    // Reset Filter
    var handleResetForm = () => {
        // Select reset button
        const resetButton = document.querySelector('[data-kt-customer-table-filter="reset"]');

        // Reset datatable
        resetButton.addEventListener('click', function () {
            // Reset month
            filterMonth.val(null).trigger('change');

            // Reset payment type
            filterPayment[0].checked = true;

            // Reset datatable --- official docs reference: https://datatables.net/reference/api/search()
            datatable.search('').draw();
        });
    }

    // Init toggle toolbar
    var initToggleToolbar = () => {
        // Toggle selected action toolbar
        // Select all checkboxes
        const checkboxes = table.querySelectorAll('[type="checkbox"]');

        // Select elements
        const deleteSelected = document.querySelector('[data-kt-coach-table-select="delete_selected"]');

        // Toggle delete selected toolbar
        checkboxes.forEach(c => {
            // Checkbox on click event
            c.addEventListener('click', function () {

                $("#checkAllCoaches").click(function () {
                    $(".checkBox").prop('checked',
                        $(this).prop('checked'));
                });

                setTimeout(function () {
                    toggleToolbars();
                }, 50);
            });
        });

        // Deleted selected rows
        deleteSelected.addEventListener('click', function () {
            // SweetAlert2 pop up --- official docs reference: https://sweetalert2.github.io/
            Swal.fire({
                text: "Are you sure you want to delete selected customers?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, delete!",
                cancelButtonText: "No, cancel",
                customClass: {
                    confirmButton: "btn fw-bold btn-danger",
                    cancelButton: "btn fw-bold btn-active-light-primary"
                }
            }).then(function (result) {
                if (result.value) {

                    var selectedIDs = new Array();
                    $('input:checkbox.checkBox').each(function () {
                        if ($(this).prop('checked')) {
                            selectedIDs.push($(this).attr('data-id'));
                        }
                    });
                    var postCoachData = { values: selectedIDs }
                    console.log(postCoachData);
                    $.ajax({
                        "url": "/Coach/DeleteMultipleCoach/",
                        "type": "POST",
                        "data": postCoachData,
                        "dataType": "json",
                        success: function (data) {
                            if (data.success.result === true) {
                                Swal.fire({
                                    text: "You have deleted all selected customers!.",
                                    icon: "success",
                                    buttonsStyling: false,
                                    confirmButtonText: "Ok, got it!",
                                    customClass: {
                                        confirmButton: "btn fw-bold btn-primary",
                                    }
                                }).then(function () {
                                    // Remove all selected customers
                                    checkboxes.forEach(c => {
                                        if (c.checked) {
                                            datatable.row($(c.closest('tbody tr'))).remove().draw();
                                        }
                                    });

                                    // Remove header checked box
                                    const headerCheckbox = table.querySelectorAll('[type="checkbox"]')[0];
                                    headerCheckbox.checked = false;
                                });

                            } else {
                                Swal.fire({
                                    text: "Selected Coach can not be deleted, because it is associated with Team.",
                                    icon: "error",
                                    buttonsStyling: false,
                                    confirmButtonText: "Ok, got it!",
                                    customClass: {
                                        confirmButton: "btn fw-bold btn-primary",
                                    }
                                });
                            }
                        },
                        "traditional": true,
                    });
                }  
            });
        });
    }

    // Toggle toolbars
    const toggleToolbars = () => {
        // Define variables
        const toolbarBase = document.querySelector('[data-kt-customer-table-toolbar="base"]');
        const toolbarSelected = document.querySelector('[data-kt-customer-table-toolbar="selected"]');
        const selectedCount = document.querySelector('[data-kt-coach-table-select="selected_count"]');

        // Select refreshed checkbox DOM elements 
        const allCheckboxes = table.querySelectorAll('tbody [type="checkbox"]');

        // Detect checkboxes state & count
        let checkedState = false;
        let count = 0;

        // Count checked boxes
        allCheckboxes.forEach(c => {
            if (c.checked) {
                checkedState = true;
                count++;
            }
        });

        // Toggle toolbars
        if (checkedState) {
            selectedCount.innerHTML = count;
            toolbarBase.classList.add('d-none');
            toolbarSelected.classList.remove('d-none');
        } else {
            toolbarBase.classList.remove('d-none');
            toolbarSelected.classList.add('d-none');
        }
    }

    // Public methods
    return {
        init: function () {
            table = document.querySelector('#kt_customers_table');
            table &&
                (
                    (
                        datatable = $(table).DataTable({
                            "processing": true,
                            "serverSide": true,
                            "filter": true,
                            "paging": true,
                            "pageLength": 10,
                            "ajax": {
                                "url": "/coach/GetCoachDetails",
                                "type": "POST",
                                "dataType": "json",
                                "data": function (d) {
                                    // d.__RequestVerificationToken = $('input[name="__RequestVerificationToken"]').val();
                                    return d;
                                }
                            },
                            "columnDefs": [
                                { orderable: !1, targets: 0 },
                                { orderable: !1, targets: 3 },
                            ],
                            "columns": [
                                {
                                    "data": "id",
                                    "render": function (data, type, row, meta) {
                                        return `<div class="form-check form-check-sm form-check-custom form-check-solid"><input class="form-check-input checkBox" type="checkbox" data-id=${row.id} /></div>`;
                                    }
                                },
                                {
                                    "data": "image",
                                    "render": function (data, type, row, meta) {
                                        return `<div class='symbol symbol-circle symbol-50px overflow-hidden me-3' >
                                                  <div class='symbol-label'>
                                                   <img src="data:image/png;base64, ${row.image}" alt="${row.name}">
                                                  </div>
                                                 </a>
                                                </div>
                                                <div class='d-flex flex-column'>
                                                 <a href='#' class='text-gray-800 text-hover-primary mb-1'>${row.name}</a>
                                                </div>`
                                    }
                                },
                                { "data": "name", "name": "name", "autoWidth": true },
                                { "data": "emailAddress", "name": "email", "autoWidth": true },
                                {
                                    "render": function (data, type, row, meta) {
                                        return `<a href="#" class="btn btn-sm btn-light btn-active-light-primary" data-bs-toggle="dropdown" aria-expanded="false">Actions
														<span class="svg-icon svg-icon-5 m-0">
															<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
																<path d="M11.4343 12.7344L7.25 8.55005C6.83579 8.13583 6.16421 8.13584 5.75 8.55005C5.33579 8.96426 5.33579 9.63583 5.75 10.05L11.2929 15.5929C11.6834 15.9835 12.3166 15.9835 12.7071 15.5929L18.25 10.05C18.6642 9.63584 18.6642 8.96426 18.25 8.55005C17.8358 8.13584 17.1642 8.13584 16.75 8.55005L12.5657 12.7344C12.2533 13.0468 11.7467 13.0468 11.4343 12.7344Z" fill="black" />
															</svg>
														</span>
                                                     </a>
														<div class="dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4" data-kt-menu="true">
															<div class="menu-item px-3">
																<a href="/Coach/CoachDetails/${row.id}" class="menu-link px-3">View</a>
															</div>
															<div class="menu-item px-3">
																<a href="#" class="menu-link px-3" data-kt-customer-table-filter="delete_row" data-id=${row.id}>Delete</a>
															</div>
														</div>`
                                    }
                                }
                            ]
                        })
                    ).on("draw", function () {
                        table.querySelectorAll("tbody tr").forEach((e) => {
                        });
                        initToggleToolbar();
                        handleDeleteRows();
                        toggleToolbars();
                    })
                    ,
                    document.querySelector('[data-kt-customer-table-filter="search"]').addEventListener("keyup", function (t) {
                        datatable.search(t.target.value).draw();
                    }),
                    document.querySelector('[data-kt-customer-table-filter="reset"]').addEventListener("click", function () {
                        document
                            .querySelector('[data-kt-customer-table-filter="form"]')
                            .querySelectorAll("select")
                            .forEach((e) => {
                                $(e).val("").trigger("change");
                            }),
                            datatable.search("").draw();
                    })
                    ,
                    (() => {
                    })()
                );

            initCustomerList();
            initToggleToolbar();
            handleSearchDatatable();
            handleFilterDatatable();
            handleDeleteRows();
            handleResetForm();
        },
    };
}();

// On document ready
KTUtil.onDOMContentLoaded(function () {
    KTCustomersList.init();
});