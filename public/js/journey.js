const datetimepickerOptions = {
  format: 'DD/MM/YYYY HH:mm:ss',
  useCurrent: false,
  showTodayButton: true,
  toolbarPlacement: 'bottom',
  sideBySide: true,
  icons: {
    time: 'bi bi-clock',
    date: 'bi bi-calendar',
    up: 'bi bi-arrow-up',
    down: 'bi bi-arrow-down',
    previous: 'bi bi-chevron-left',
    next: 'bi bi-chevron-right',
    today: 'bi bi-clock',
    clear: 'bi bi-trash',
  },
};

function init() {
  $('#mining_add_user_button').click(() => {
    $.ajax({
      url: '/api/mining/user',
      type: 'POST',
      data: JSON.stringify({
        name: $('#mining_add_name').val(),
        defaultHashRate: $('#mining_add_default_hash_rate').val(),
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: updateUsers,
    });
  });
  $('#mining_add_share_button').click(() => {
    $.ajax({
      url: '/api/mining/share',
      type: 'POST',
      data: JSON.stringify({
        amount: $('#mining_share_amount').val(),
        start_time: $('#mining_share_start_time').val(),
        end_time: $('#mining_share_end_time').val(),
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
    });
  });
  setInterval(() => {
    $.get('/price', (data) => {
      $('#mining_share_calculate_table_body tr').each(function () {
        if ($(this).children('td:eq(2)').html() != '')
          $(this)
            .children('td:eq(3)')
            .html(
              parseFloat($(this).children('td:eq(2)').html() * data).toFixed(2)
            );
      });
    });
  }, 500);
  $('input.datetimepicker').datetimepicker(datetimepickerOptions);
  updateUsers();
  updateShares();
}

function updateUsers() {
  $.get('/api/mining/users', (users) => {
    $('#mining_table_body').html('');
    $('#mining_share_calculate_table_body').html('');
    users.forEach((user) => {
      $('#mining_table_body').append(`\
                <tr>\
                    <td>${user.id}</td>\
                    <td>${user.name}</td>\
                    <td>\
                        <div class="input-group">\
                            <input class="form-control" type="text" id="mining_table_default_hash_rate-${user.id}" value="${user.defaultHashRate}" />\
                            <button class="form-control btn btn-primary" id="mining_table_update_default_hash_rate-${user.id}">Update value</button>\
                        </div>\
                    </td>\
                    <td>\
                        <div class="input-group">\
                            <input class="form-control" type="text" id="mining_table_action_date-${user.id}" />\
                            <button class="form-control btn btn-success" id="mining_table_add_start-${user.id}"><i class="bi bi-play-fill"></i>Start</button>\
                            <button class="form-control btn btn-danger" id="mining_table_add_end-${user.id}"><i class="bi bi-pause-fill"></i>End</button>\
                        </div>\
                    </td>\
                </tr>`);
      $('#mining_share_calculate_table_body').append(`\
                <tr id="mining_share_calculate_table_row-${user.id}">\
                    <td>${user.name}</td>\
                    <td></td>\
                    <td></td>\
                    <td></td>\
                </tr>`);
      $(`#mining_table_update_default_hash_rate-${user.id}`).click(() =>
        updateUserDefaultHashRate(user.id)
      );
      $(`#mining_table_action_date-${user.id}`).datetimepicker(
        datetimepickerOptions
      );
      $(`#mining_table_add_start-${user.id}`).click(() =>
        addMiningBlock(user.id, 'Start')
      );
      $(`#mining_table_add_end-${user.id}`).click(() =>
        addMiningBlock(user.id, 'End')
      );
    });
  });
}

function updateShares() {
  $.get('/api/mining/shares', (shares) => {
    $('#mining_share_table_body').html('');
    shares.forEach((share) => {
      $('#mining_share_table_body').append(`\
                <tr>\
                    <td>${share.id}</td>\
                    <td>${share.start_time}</td>\
                    <td>${share.end_time}</td>\
                    <td>${share.amount}</td>\
                    <td>\
                        <button class="form-control btn btn-primary" id="mining_share_table_calculate-${share.id}">Calculate share</button>\
                    </td>\
                </tr>`);
      $(`#mining_share_table_calculate-${share.id}`).click(() =>
        calculateShare(share.id)
      );
    });
  });
}

function addMiningBlock(userID, type) {
  var date = new Date().toISOString();
  if ($(`#mining_table_action_date-${userID}`).val() != '')
    date = $(`#mining_table_action_date-${userID}`).val();
  $.ajax({
    url: '/api/mining/block',
    type: 'POST',
    data: JSON.stringify({
      type: type,
      date: date,
      user: userID,
    }),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
  });
}

function updateUserDefaultHashRate(userID) {
  $.ajax({
    url: `/api/mining/user/${userID}/defaultHashRate`,
    type: 'PUT',
    data: JSON.stringify({
      defaultHashRate: $(`#mining_table_default_hash_rate-${userID}`).val(),
    }),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
  });
}

function calculateShare(shareID) {
  $('#mining_share_calculate_id_label').html(shareID);
  $.get(`/api/mining/share/${shareID}/sharesResult`, (resultObject) => {
    for (const userID in resultObject.workedMilliseconds) {
      $(`#mining_share_calculate_table_row-${userID} td:eq(1)`).html(
        parseFloat(
          resultObject.workedMilliseconds[userID] / 1000 / 60 / 60
        ).toFixed(2)
      );
    }
    for (const userID in resultObject.amounts) {
      $(`#mining_share_calculate_table_row-${userID} td:eq(2)`).html(
        parseFloat(resultObject.amounts[userID]).toFixed(7)
      );
    }
    $('#mining_share_calculate_table_foot td:eq(1)').html(
      parseFloat(resultObject.totalMilliseconds / 1000 / 60 / 60).toFixed(2)
    );
  });
}
