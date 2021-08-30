class HWWalletController {
  constructor() {
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
      $.get('/api/coins/values', (data) => {
        let totalAmount = 0;
        data.forEach((value, index) => {
          if (value === null || value === undefined) return;
          let floatValue = parseFloat(value);
          let amount =
            parseFloat(
              $(`#hw_wallet_table_row-${index}`).children('td:eq(2)').html()
            ) * floatValue;
          totalAmount += amount;
          $(`#hw_wallet_table_row-${index}`)
            .children('td:eq(1)')
            .html(floatValue.toFixed(2) + '&euro;');
          $(`#hw_wallet_table_row-${index}`)
            .children('td:eq(3)')
            .html(amount.toFixed(2) + '&euro;');
        });
        $('#hw_wallet_calculate_total').html(totalAmount.toFixed(2) + '&euro;');
      });
    }, 500);
    this.updateHWWalletCoins();
  }

  updateHWWalletCoins() {
    $.get('/api/coins', (coins) => {
      $('#hw_wallet_calculate_table_body').html('');
      coins.forEach((coin) => {
        $('#hw_wallet_calculate_table_body').append(`\
          <tr id="hw_wallet_table_row-${coin.id}">\
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
          this.addHWWalletAmount(coin.id)
        );
        $(`#hw_wallet_table_replace-${coin.id}`).click(() =>
          this.replaceHWWalletAmount(coin.id)
        );
        $(`#hw_wallet_table_delete-${coin.id}`).click(() =>
          this.deleteCoin(coin.id)
        );
      });
      this.updateHWWalletAmounts();
    });
  }

  updateHWWalletAmounts() {
    $.get('/api/hwwallet/amounts', (amounts) => {
      amounts.forEach((amount, index) => {
        if (amount)
          $(`#hw_wallet_table_amount-${index}`).html(amount.toFixed(8));
      });
    });
  }

  addHWWalletAmount(coinID) {
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
      success: this.updateHWWalletCoins,
    });
  }

  replaceHWWalletAmount(coinID) {
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
      success: this.updateHWWalletCoins,
    });
  }

  deleteCoin(id) {
    $.ajax({
      url: `/api/coins/${id}`,
      type: 'DELETE',
      success: this.updateHWWalletCoins,
    });
  }
}
