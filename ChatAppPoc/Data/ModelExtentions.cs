using ChatAppPoc.Models;

namespace ChatAppPoc.Data
{
    public static class ModelExtentions
    {
        public static ChatUserVm ToChatUserVm(this ApplicationUser applicationUser)
        {
            return new ChatUserVm
            {
                UserName = applicationUser.UserName,
                Email = applicationUser.Email,
                Phone = applicationUser.PhoneNumber
            };
        }
    }
}
