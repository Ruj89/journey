class UsersController {
  constructor() {
    $('#mining_add_user_button').click(() => this.addUser());
    this.updateUsers();
  }

  addUser() {
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
      success: this.updateUsers,
    });
  }

  updateUsers() {
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
          this.updateUserDefaultHashRate(user.id)
        );
        $(`#mining_table_action_date-${user.id}`).datetimepicker(
          datetimepickerOptions
        );
        $(`#mining_table_add_start-${user.id}`).click(() =>
          this.addMiningBlock(user.id, 'Start')
        );
        $(`#mining_table_add_end-${user.id}`).click(() =>
          this.addMiningBlock(user.id, 'End')
        );
        $(`#mining_table_delete_user-${user.id}`).click(() =>
          this.deleteUser(user.id)
        );
      });
    });
  }

  deleteUser(id) {
    $.ajax({
      url: `/api/mining/user/${id}`,
      type: 'DELETE',
      success: this.updateUsers,
    });
  }

  addMiningBlock(userID, type) {
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

  updateUserDefaultHashRate(userID) {
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
}
