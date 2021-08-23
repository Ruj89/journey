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
  $('#mining_add_user_button').click(() => addUser());
  $('#mining_add_share_button').click(() => {
    $.ajax({
      url: '/api/mining/share',
      type: 'POST',
      data: JSON.stringify({
        amount: $('#mining_share_amount').val(),
        start_time: moment(
          $('#mining_share_start_time').val(),
          datetimepickerOptions.format
        ).toISOString(),
        end_time: moment(
          $('#mining_share_end_time').val(),
          datetimepickerOptions.format
        ).toISOString(),
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
    });
  });
  $('#mining_parse_telegram_button').click(() => {
    $.ajax({
      url: '/telegram',
      type: 'POST',
      data: JSON.stringify({
        text: $('#mining_parse_telegram_textarea').val(),
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
    });
  });
  $('#hw_wallet_add_coin_button').click(() => {
    $.ajax({
      url: '/api/coins',
      type: 'POST',
      data: JSON.stringify({
        name: $('#hw_wallet_add_name').val(),
        ticker: $('#hw_wallet_add_ticker').val(),
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
    });
  });
  setInterval(() => {
    $.get('/price', (data) => {
      $('#mining_share_calculate_table_body > tr').each(function () {
        if ($(this).children('td:eq(2)').html() != '')
          $(this)
            .children('td:eq(3)')
            .html(
              parseFloat($(this).children('td:eq(2)').html() * data).toFixed(2)
            );
      });
    });
    $.get('/api/coins/values', (data) => {
      let totalAmount = 0;
      $('#hw_wallet_calculate_table_body > tr').each(function (index) {
        if (data[index]) {
          let amount = parseFloat(
            $(this).children('td:eq(2)').html() * data[index]
          );
          totalAmount += amount;
          $(this)
            .children('td:eq(1)')
            .html(data[index] + '&euro;');
          $(this)
            .children('td:eq(3)')
            .html(amount.toFixed(2) + '&euro;');
        }
      });
      $('#hw_wallet_calculate_total').html(totalAmount.toFixed(2) + '&euro;');
    });
  }, 500);
  $('input.datetimepicker').datetimepicker(datetimepickerOptions);
  updateUsers();
  updateShares();
  updateHWWalletCoins();
}

function addUser() {
  $.ajax({
    url: '/api/mining/user',
    type: 'POST',
    data: JSON.stringify({
      name: $('#mining_add_name').val(),
      defaultHashRate: $('#mining_add_default_hash_rate').val(),
      telegramName: $('#mining_add_telegram_name').val(),
    }),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: updateUsers,
  });
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
          <td>${user.telegramName}</td>\
          <td>\
            <div class="input-group">\
              <input class="form-control" type="text" id="mining_table_action_date-${user.id}" />\
              <button class="form-control btn btn-success" id="mining_table_add_start-${user.id}"><i class="bi bi-play-fill"></i>Start</button>\
              <button class="form-control btn btn-danger" id="mining_table_add_end-${user.id}"><i class="bi bi-pause-fill"></i>End</button>\
              <button class="form-control btn btn-danger" id="mining_table_delete_user-${user.id}"><i class="bi bi-trash-fill"></i></button>\
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
      $(`#mining_table_delete_user-${user.id}`).click(() =>
        deleteUser(user.id)
      );
    });
  });
}
function deleteUser(id) {
  $.ajax({
    url: `/api/mining/user/${id}`,
    type: 'DELETE',
    success: updateUsers,
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
    date = moment(
      $(`#mining_table_action_date-${userID}`).val(),
      datetimepickerOptions.format
    );
  $.ajax({
    url: '/api/mining/block',
    type: 'POST',
    data: JSON.stringify({
      type: type,
      date: date.toISOString(),
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

function updateHWWalletCoins() {
  $.get('/api/coins', (coins) => {
    $('#hw_wallet_calculate_table_body').html('');
    coins.forEach((coin) => {
      $('#hw_wallet_calculate_table_body').append(`\
        <tr>\
          <td>${coin.name}</td>\
          <td>0 &euro;</td>\
          <td id="hw_wallet_table_amount-${coin.id}">0</td>\
          <td>0 &euro;</td>\
          <td>\
            <div class="input-group">\
              <input class="form-control" type="text" id="hw_wallet_table_action_amount-${coin.id}" />\
              <input class="form-control" type="text" id="hw_wallet_table_action_date-${coin.id}" />\
              <button class="form-control btn btn-success" id="hw_wallet_table_add-${coin.id}"><i class="bi bi-plus-circle-fill"></i>Insert</button>\
              <button class="form-control btn btn-primary" id="hw_wallet_table_replace-${coin.id}"><i class="bi bi-scissors"></i>Replace</button>\
              <button class="form-control btn btn-danger" id="hw_wallet_table_delete-${coin.id}"><i class="bi bi-trash-fill"></i>Remove coin</button>\
            </div>\
          </td>\
        </tr>`);
      $(`#hw_wallet_table_action_date-${coin.id}`).datetimepicker(
        datetimepickerOptions
      );
      $(`#hw_wallet_table_add-${coin.id}`).click(() =>
        addHWWalletAmount(coin.id)
      );
      $(`#hw_wallet_table_replace-${coin.id}`).click(() =>
        replaceHWWalletAmount(coin.id)
      );
      $(`#hw_wallet_table_delete-${coin.id}`).click(() => deleteCoin(coin.id));
    });
    updateHWWalletAmounts();
  });
}

function deleteCoin(id) {
  $.ajax({
    url: `/api/coins/${id}`,
    type: 'DELETE',
    success: updateHWWalletCoins,
  });
}

function updateHWWalletAmounts() {
  $.get('/api/hwwallet/amounts', (amounts) => {
    amounts.forEach((amount, index) => {
      if (amount) $(`#hw_wallet_table_amount-${index}`).html(amount.toFixed(8));
    });
  });
}

function addHWWalletAmount(coinID) {
  var date = new Date().toISOString();
  if ($(`#hw_wallet_table_action_date-${coinID}`).val() != '')
    date = moment(
      $(`#hw_wallet_table_action_date-${coinID}`).val(),
      datetimepickerOptions.format
    );
  $.ajax({
    url: '/api/hwwallet',
    type: 'POST',
    data: JSON.stringify({
      value: $(`#hw_wallet_table_action_amount-${coinID}`).val(),
      time: date.toISOString(),
      coin: coinID,
    }),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: updateHWWalletCoins,
  });
}

function replaceHWWalletAmount(coinID) {
  var date = new Date().toISOString();
  if ($(`#hw_wallet_table_action_date-${coinID}`).val() != '')
    date = moment(
      $(`#hw_wallet_table_action_date-${coinID}`).val(),
      datetimepickerOptions.format
    );
  $.ajax({
    url: '/api/hwwallet',
    type: 'POST',
    data: JSON.stringify({
      value:
        $(`#hw_wallet_table_action_amount-${coinID}`).val() -
        parseFloat($(`#hw_wallet_table_amount-${coinID}`).html()),
      time: date.toISOString(),
      coin: coinID,
    }),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: updateHWWalletCoins,
  });
}
