import TeamRegistrationPageComponent from "../../../../src/components/commons/units/teamRegistration/teamRegistration.container";

export default function HomeTeamRegistration() {
  return (
    <>
      <div>
        <TeamRegistrationPageComponent isHomeTeam={true} />
      </div>
    </>
  );
}
