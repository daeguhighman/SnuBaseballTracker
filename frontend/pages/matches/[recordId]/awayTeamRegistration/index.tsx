import TeamRegistrationPageComponent from "../../../../src/components/commons/units/teamRegistration/teamRegistration.container";

export default function AwayTeamRegistration() {
  return (
    <>
      <div>
        <TeamRegistrationPageComponent isHomeTeam={false} />
      </div>
    </>
  );
}
