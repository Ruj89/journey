class TelegramController {
  constructor() {
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
  }
}
