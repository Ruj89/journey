class SharesController {
  constructor() {
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
    setInterval(() => {
      $.get('/price', (data) => {
        $('#mining_share_calculate_table_body > tr').each(function () {
          if ($(this).children('td:eq(2)').html() != '')
            $(this)
              .children('td:eq(3)')
              .html(
                parseFloat($(this).children('td:eq(2)').html() * data).toFixed(
                  2
                )
              );
        });
      });
    }, 500);
    this.updateShares();
  }

  updateShares() {
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
          this.calculateShare(share.id)
        );
      });
    });
  }

  calculateShare(shareID) {
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
}
