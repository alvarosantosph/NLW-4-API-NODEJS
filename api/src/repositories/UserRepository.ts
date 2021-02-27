import { EntityRepository, Repository } from "typeorm";

import { User } from "../models/User";

@EntityRepository(User)
class UseRepository extends Repository<User> {}

export { UseRepository };