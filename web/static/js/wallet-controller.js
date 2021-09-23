class WalletController {
  constructor() {
    $('#wallet_add_coin_button').click(() => {
      $.ajax({
        url: '/api/coins',
        type: 'POST',
        data: JSON.stringify({
          name: $('#wallet_add_name').val(),
          ticker: $('#wallet_add_ticker').val(),
        }),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
      });
    });
    $('#wallet_calculate_table_show_zero_account').change(function () {
      if (this.checked) $('.zero_amount_account').show();
      else $('.zero_amount_account').hide();
    });
    setInterval(() => {
      $.get('/api/coins/values', (data) => {
        let totalAmount = 0;
        data.forEach((value, index) => {
          if (value === null || value === undefined) return;
          let floatValue = parseFloat(value);
          let amount =
            parseFloat(
              $(`#wallet_table_row-${index}`).children('td:eq(2)').html()
            ) * floatValue;
          totalAmount += amount;
          $(`#wallet_table_row-${index}`)
            .children('td:eq(1)')
            .html(floatValue.toFixed(2) + '&euro;');
          $(`#wallet_table_row-${index}`)
            .children('td:eq(3)')
            .html(amount.toFixed(2) + '&euro;');
        });
        $('#wallet_calculate_total').html(totalAmount.toFixed(2) + '&euro;');
      });
    }, 500);
    this.updateWalletCoins();
  }

  updateWalletCoins() {
    $.get('/api/coins', (coins) => {
      $('#wallet_calculate_table_body').html('');
      coins.forEach((coin) => {
        $('#wallet_calculate_table_body').append(`\
          <tr id="wallet_table_row-${coin.id}">\
            <td>${coin.name}</td>\
            <td>0 &euro;</td>\
            <td id="wallet_table_amount-${coin.id}">0</td>\
            <td>0 &euro;</td>\
            <td>\
              <div class="input-group">\
                <input class="form-control" type="text" id="wallet_table_action_amount-${coin.id}" />\
                <input class="form-control" type="text" id="wallet_table_action_date-${coin.id}" />\
                <button class="form-control btn btn-success" id="wallet_table_add-${coin.id}"><i class="bi bi-plus-circle-fill"></i>Insert</button>\
                <button class="form-control btn btn-primary" id="wallet_table_replace-${coin.id}"><i class="bi bi-scissors"></i>Replace</button>\
                <button class="form-control btn btn-danger" id="wallet_table_delete-${coin.id}"><i class="bi bi-trash-fill"></i>Remove coin</button>\
              </div>\
            </td>\
          </tr>`);
        $(`#wallet_table_action_date-${coin.id}`).datetimepicker(
          datetimepickerOptions
        );
        $(`#wallet_table_add-${coin.id}`).click(() =>
          this.addWalletAmount(coin.id)
        );
        $(`#wallet_table_replace-${coin.id}`).click(() =>
          this.replaceWalletAmount(coin.id)
        );
        $(`#wallet_table_delete-${coin.id}`).click(() =>
          this.deleteCoin(coin.id)
        );
      });
      this.updateWalletAmounts();
    });
  }

  updateWalletAmounts() {
    $.get('/api/wallet/amounts', (amounts) => {
      amounts.forEach((amount, index) => {
        if (amount) {
          $(`#wallet_table_row-${index}`)
            .removeClass('zero_amount_account')
            .show();
          $(`#wallet_table_amount-${index}`).html(amount.toFixed(8));
        } else {
          $(`#wallet_table_row-${index}`).addClass('zero_amount_account');
          if ($('#wallet_calculate_table_show_zero_account').prop('checked'))
            $(`#wallet_table_row-${index}`).show();
          else $(`#wallet_table_row-${index}`).hide();
        }
      });
    });
  }

  addWalletAmount(coinID) {
    var date = new Date().toISOString();
    if ($(`#wallet_table_action_date-${coinID}`).val() != '')
      date = moment(
        $(`#wallet_table_action_date-${coinID}`).val(),
        datetimepickerOptions.format
      );
    $.ajax({
      url: '/api/wallet',
      type: 'POST',
      data: JSON.stringify({
        value: $(`#wallet_table_action_amount-${coinID}`)
          .val()
          .replace(',', '.'),
        time: date.toISOString(),
        coin: coinID,
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: this.updateWalletCoins,
    });
  }

  replaceWalletAmount(coinID) {
    var date = new Date().toISOString();
    if ($(`#wallet_table_action_date-${coinID}`).val() != '')
      date = moment(
        $(`#wallet_table_action_date-${coinID}`).val(),
        datetimepickerOptions.format
      );
    $.ajax({
      url: '/api/wallet',
      type: 'POST',
      data: JSON.stringify({
        value:
          $(`#wallet_table_action_amount-${coinID}`).val().replace(',', '.') -
          parseFloat($(`#wallet_table_amount-${coinID}`).html()),
        time: date.toISOString(),
        coin: coinID,
      }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: this.updateWalletCoins,
    });
  }

  deleteCoin(id) {
    $.ajax({
      url: `/api/coins/${id}`,
      type: 'DELETE',
      success: this.updateWalletCoins,
    });
  }
}
