using Microsoft.EntityFrameworkCore.Migrations;

namespace ChatAppPoc.Data.Migrations
{
    public partial class ChatMessages_Col_Seen_Added : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Seen",
                table: "ChatMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Seen",
                table: "ChatMessages");
        }
    }
}
