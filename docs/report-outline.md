# Physics project report — Earth–Moon journey and landing

1. **Objectives/rubric:** explain 2D motion, Newton's second law, gravitation, circular motion and work/energy through the interactive Earth–Moon mission. The spacecraft alone is not a closed momentum-conserving system.
2. **Model/assumptions:** SI units, Earth-centered differential lunar gravity, circular prescribed Moon, constant Isp, point spacecraft and simplified rotating atmosphere/drag, calculated ground launch/staging, direct attitude and no torque. The earlier flat-gravity lab is separate.
3. **Equations:** map source functions to orbital-physics.md and lunar-landing.md. Explain relative radial/tangential velocity, thrust acceleration, mass flow and ideal delta-v. State the teaching touchdown limits.
4. **Algorithm:** bounded Verlet/RK4, fuel-exhaustion splitting, moving-surface event detection, adaptive warp and frame budget. Explain the landing controller and why the larger vehicle preserves the departure trajectory but retains landing fuel.
5. **Validation:** include orbital analytical comparisons, original flyby tests, finite-burn landing reconstruction, stage/pad/drag tests and actual whole pad-to-Moon contact. Use current validation outputs rather than older test totals.
6. **Interaction/illustration:** show guidance/manual modes, Moon-relative landing readouts, engine-off forecast limitation, illustrated flight vs scaled map, fullscreen and pause/exit/state preservation. Label enlarged artwork and illustrative terrain.
7. **Results:** attach actual CSV/report and screenshots. Discuss incoming touchdown speeds, tilt, remaining fuel, time and a failed/manual run. Segment fuel/delta-v exclude the completed departure burn; charts remain Earth-centered. Compare forecasts with the later powered path.
8. **Limitations/improvements:** 2D, prescribed Moon, finite step accuracy, direct attitude, no torque/terrain contact mechanics. Landing is not a demonstration of orbit capture. Mars/3D/backend remain future work.
9. **Team contributions/reflection:** describe individual implementation, testing, documentation and presentation work. Add your own interpretation, lessons learned and rehearsal results.

The prior landing report outline remains in landing-report-outline.md. Current landing explanation and demo: lunar-landing.md. Final student interpretation and school hardware rehearsal remain required.

For the full default mission, explain staged mass/fuel accounting and the calibrated initial launch window. Include burned propellant versus unused discarded reserve, Earth rotation versus surface-relative speed, approximate layer labels and100km convention. Compare the actual browser result with docs/evidence/earth-launch.csv and earth-launch-report.md. State the ideal tiny-throttle insertion and exponential-atmosphere limits. See earth-launch.md for exact source/API/equations.
